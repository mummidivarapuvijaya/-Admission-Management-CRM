import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { AcademicYear, Applicant, Program } from '../types';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  guardianName: '',
  category: 'GM',
  entryType: 'Regular',
  quotaType: 'KCET',
  marksPercent: '85',
  qualifyingExam: '12th / PUC',
  isJkCategory: false,
  programId: '',
  academicYearId: '',
};

export function ApplicantsPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Applicant[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Applicant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mastersLoading, setMastersLoading] = useState(false);
  const [mastersError, setMastersError] = useState<string | null>(null);

  function load() {
    api<Applicant[]>('/applicants')
      .then(setRows)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load applicants', 'error'));
  }

  const loadMasters = useCallback(async () => {
    setMastersError(null);
    setMastersLoading(true);
    try {
      const [p, y] = await Promise.all([
        api<Program[]>('/masters/programs'),
        api<AcademicYear[]>('/masters/academic-years'),
      ]);
      setPrograms(Array.isArray(p) ? p : []);
      setYears(Array.isArray(y) ? y : []);
    } catch (e) {
      setPrograms([]);
      setYears([]);
      const msg = e instanceof Error ? e.message : 'Could not load programs or academic years';
      setMastersError(msg);
      showToast(`${msg} — check API and sign-in.`, 'error');
    } finally {
      setMastersLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    if (open) loadMasters();
  }, [open, loadMasters]);

  async function createApplicant(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/applicants', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          dateOfBirth: new Date(form.dateOfBirth).toISOString(),
          addressLine: form.address,
          city: '',
          state: '',
          pincode: '',
          fatherName: form.guardianName,
          motherName: '',
          category: form.category,
          entryType: form.entryType,
          quotaType: form.quotaType,
          marksPercent: Number(form.marksPercent),
          qualifyingExam: form.qualifyingExam,
          isJkCategory: form.isJkCategory,
          programId: form.programId,
          academicYearId: form.academicYearId,
        }),
      });
      setOpen(false);
      setForm(emptyForm);
      load();
      showToast('Applicant created successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create applicant', 'error');
    }
  }

  async function patchApplicant(id: string, body: Record<string, unknown>) {
    try {
      await api(`/applicants/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      load();
      if (detail?._id === id) {
        const u = await api<Applicant>(`/applicants/${id}`);
        setDetail(u);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update applicant', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h5">Applicants</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New applicant
        </Button>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Quota</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Docs</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell>Admission #</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a._id} hover>
                  <TableCell>
                    {a.firstName} {a.lastName}
                  </TableCell>
                  <TableCell>{(a.programId as Program)?.branchCode}</TableCell>
                  <TableCell>{a.seatLockedQuota || a.quotaType}</TableCell>
                  <TableCell>{a.admissionStatus}</TableCell>
                  <TableCell>{a.documentStatus}</TableCell>
                  <TableCell>{a.feeStatus}</TableCell>
                  <TableCell>{a.admissionNumber || '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setDetail(a)}
                        startIcon={<DescriptionOutlinedIcon />}
                      >
                        Documents &amp; fee
                      </Button>
                      {a.admissionNumber && (
                        <Button size="small" component={Link} to={`/app/admission-confirmed/${a._id}`} variant="outlined">
                          Confirmation
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New applicant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }} component="form" id="applicant-form" onSubmit={createApplicant}>
            {mastersLoading && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={32} />
              </Box>
            )}
            {!mastersLoading && !mastersError && (programs.length === 0 || years.length === 0) && (
              <Alert severity="warning">
                <Typography variant="body2" component="span" display="block" gutterBottom>
                  Dropdowns are empty because master data is missing in MongoDB (common on a new Atlas database).
                </Typography>
                <Typography variant="body2" component="div">
                  • Sign in as <strong>admin</strong> (<code>admin@demo.edu</code> after <code>npm run seed</code>) and use{' '}
                  <strong>Master setup</strong> to add academic year + program chain, or
                  <br />• Run <code>cd backend &amp;&amp; npm run seed</code> to load demo institution, program, and 2026 academic year.
                </Typography>
              </Alert>
            )}
            <TextField label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <TextField label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <TextField label="Date of birth" type="date" InputLabelProps={{ shrink: true }} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
            <TextField
              label="Address (full)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              multiline
              minRows={2}
              helperText="Include street, city, state, and PIN as needed."
            />
            <TextField
              label="Parent / guardian name"
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
              required
            />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['GM', 'SC', 'ST', 'OBC', 'EWS', 'Other'].map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Entry type" value={form.entryType} onChange={(e) => setForm({ ...form, entryType: e.target.value })}>
              <MenuItem value="Regular">Regular</MenuItem>
              <MenuItem value="Lateral">Lateral</MenuItem>
            </TextField>
            <TextField select label="Preferred quota" value={form.quotaType} onChange={(e) => setForm({ ...form, quotaType: e.target.value })}>
              <MenuItem value="KCET">KCET</MenuItem>
              <MenuItem value="COMEDK">COMEDK</MenuItem>
              <MenuItem value="Management">Management</MenuItem>
            </TextField>
            <TextField label="Marks %" type="number" value={form.marksPercent} onChange={(e) => setForm({ ...form, marksPercent: e.target.value })} required />
            <TextField label="Qualifying exam" value={form.qualifyingExam} onChange={(e) => setForm({ ...form, qualifyingExam: e.target.value })} required />
            <TextField
              select
              label="Program"
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
              required
              disabled={mastersLoading || programs.length === 0}
              SelectProps={{ displayEmpty: true }}
              helperText={!mastersLoading && programs.length === 0 ? 'Add programs as admin first' : undefined}
            >
              {programs.length === 0 ? (
                <MenuItem value="" disabled>
                  No programs available
                </MenuItem>
              ) : (
                programs.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name} ({p.branchCode})
                  </MenuItem>
                ))
              )}
            </TextField>
            <TextField
              select
              label="Academic year"
              value={form.academicYearId}
              onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
              required
              disabled={mastersLoading || years.length === 0}
              SelectProps={{ displayEmpty: true }}
              helperText={!mastersLoading && years.length === 0 ? 'Add academic years as admin first' : undefined}
            >
              {years.length === 0 ? (
                <MenuItem value="" disabled>
                  No academic years available
                </MenuItem>
              ) : (
                years.map((y) => (
                  <MenuItem key={y._id} value={y._id}>
                    {y.label} ({y.year})
                  </MenuItem>
                ))
              )}
            </TextField>
            <FormControlLabel
              control={<Switch checked={form.isJkCategory} onChange={(e) => setForm({ ...form, isJkCategory: e.target.checked })} />}
              label="J&K category (institution cap)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            form="applicant-form"
            variant="contained"
            disabled={mastersLoading || programs.length === 0 || years.length === 0 || !!mastersError}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        {detail && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              Document verification &amp; fee
              <Typography variant="body2" component="div" color="text.secondary" fontWeight={400} sx={{ mt: 0.5 }}>
                {detail.firstName} {detail.lastName} · Admission status: {detail.admissionStatus}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Set documents to <strong>Verified</strong> and fee to <strong>Paid</strong> before confirming admission on{' '}
                  <strong>Seat allocation</strong>.
                </Typography>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Document file (optional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Stores the selected file name only (not the file itself).
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button component="label" variant="outlined" size="small">
                      Choose file
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const name = e.target.files?.[0]?.name ?? '';
                          void patchApplicant(detail._id, { documentFileName: name });
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {detail.documentFileName ? (
                      <>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {detail.documentFileName}
                        </Typography>
                        <Button size="small" onClick={() => patchApplicant(detail._id, { documentFileName: '' })}>
                          Clear name
                        </Button>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No file name recorded
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <TextField
                  select
                  label="Document verification"
                  value={detail.documentStatus}
                  onChange={(e) => patchApplicant(detail._id, { documentStatus: e.target.value })}
                  helperText="Mark Verified after checking certificates, ID, and eligibility."
                  fullWidth
                >
                  {['Pending', 'Submitted', 'Verified'].map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Fee payment"
                  value={detail.feeStatus}
                  onChange={(e) => patchApplicant(detail._id, { feeStatus: e.target.value })}
                  disabled={detail.admissionStatus === 'Confirmed'}
                  helperText={
                    detail.admissionStatus === 'Confirmed'
                      ? 'Fee cannot be changed after admission is confirmed.'
                      : 'Mark Paid when payment is received or recorded.'
                  }
                  fullWidth
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </TextField>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetail(null)} variant="contained">
                Done
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}

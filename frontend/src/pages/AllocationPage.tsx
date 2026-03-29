import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { AcademicYear, Applicant, ProgramIntake } from '../types';

function refId(ref: string | { _id?: string } | undefined | null): string {
  if (ref == null) return '';
  return typeof ref === 'string' ? ref : String(ref._id ?? '');
}

export function AllocationPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [intakes, setIntakes] = useState<ProgramIntake[]>([]);

  const [applicantId, setApplicantId] = useState('');
  const [programIntakeId, setProgramIntakeId] = useState('');
  const [govQuota, setGovQuota] = useState<'KCET' | 'COMEDK'>('KCET');
  const [allotmentNumber, setAllotmentNumber] = useState('');
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  /** Empty = all years */
  const [filterYearId, setFilterYearId] = useState('');

  function load() {
    api<Applicant[]>('/applicants')
      .then(setApplicants)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load applicants', 'error'));
    api<ProgramIntake[]>('/program-intakes')
      .then(setIntakes)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load intakes', 'error'));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    api<AcademicYear[]>('/masters/academic-years')
      .then((rows) => setAcademicYears(Array.isArray(rows) ? rows : []))
      .catch(() => setAcademicYears([]));
  }, []);

  const applicantsInView = useMemo(() => {
    if (!filterYearId) return applicants;
    return applicants.filter((a) => refId(a.academicYearId as string | { _id: string }) === filterYearId);
  }, [applicants, filterYearId]);

  const selectedApplicant = useMemo(
    () => applicants.find((a) => a._id === applicantId),
    [applicants, applicantId]
  );

  const intakesForApplicant = useMemo(() => {
    if (!selectedApplicant) return [];
    const pid = refId(selectedApplicant.programId as string | { _id: string });
    const yid = refId(selectedApplicant.academicYearId as string | { _id: string });
    return intakes.filter(
      (i) => refId(i.programId as string | { _id: string }) === pid && refId(i.academicYearId as string | { _id: string }) === yid
    );
  }, [intakes, selectedApplicant]);

  useEffect(() => {
    if (!programIntakeId) return;
    const stillValid = intakesForApplicant.some((i) => i._id === programIntakeId);
    if (!stillValid) setProgramIntakeId('');
  }, [applicantId, intakesForApplicant, programIntakeId]);

  useEffect(() => {
    if (!applicantId) return;
    const stillListed = applicantsInView.some((a) => a._id === applicantId);
    if (!stillListed) {
      setApplicantId('');
      setProgramIntakeId('');
    }
  }, [filterYearId, applicantsInView, applicantId]);

  async function allocateGov(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/allocations/government', {
        method: 'POST',
        body: JSON.stringify({ applicantId, programIntakeId, quotaType: govQuota, allotmentNumber }),
      });
      showToast('Government seat allocated (quota checked, seat locked).', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Allocation failed', 'error');
    }
  }

  async function allocateMgmt(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/allocations/management-quota', {
        method: 'POST',
        body: JSON.stringify({ applicantId, programIntakeId }),
      });
      showToast('Seat allocated on Management quota.', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Allocation failed', 'error');
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<Applicant>(`/allocations/confirm/${applicantId}`, { method: 'POST' });
      showToast(`Admission confirmed. Number: ${res.admissionNumber ?? ''}`, 'success');
      load();
      navigate(`/app/admission-confirmed/${applicantId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Confirmation failed', 'error');
    }
  }

  const selectedIntake = intakesForApplicant.find((i) => i._id === programIntakeId);

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Seat allocation &amp; confirmation</Typography>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={600} gutterBottom>
            Select applicant &amp; matching intake (same program + academic year as the applicant)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            New programs (e.g. ECE) need a <strong>Seat matrix &amp; quotas</strong> row for that program and year before allocation appears here.
          </Typography>
          <Stack spacing={2} maxWidth={480}>
            <TextField
              select
              label="Filter by academic year"
              value={filterYearId}
              onChange={(e) => {
                setFilterYearId(e.target.value);
              }}
              fullWidth
              helperText="Narrow the applicant list; intakes still follow each applicant’s own year."
            >
              <MenuItem value="">
                <em>All years</em>
              </MenuItem>
              {academicYears.map((y) => (
                <MenuItem key={y._id} value={y._id}>
                  {y.label} ({y.year})
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Applicant" value={applicantId} onChange={(e) => setApplicantId(e.target.value)} fullWidth>
              {applicantsInView.map((a) => {
                const y = a.academicYearId as AcademicYear | undefined;
                const yearPart = y ? `${y.label} (${y.year})` : '—';
                return (
                  <MenuItem key={a._id} value={a._id}>
                    {a.firstName} {a.lastName} — {a.admissionStatus} — {(a.programId as { branchCode?: string })?.branchCode} —{' '}
                    {yearPart}
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              select
              label="Program intake"
              value={programIntakeId}
              onChange={(e) => setProgramIntakeId(e.target.value)}
              fullWidth
              disabled={!applicantId || intakesForApplicant.length === 0}
              helperText={
                applicantId && intakesForApplicant.length === 0
                  ? 'No intake for this applicant’s program + academic year — add that program+year under Seat matrix & quotas (admin).'
                  : applicantId
                    ? 'Listed intakes match this applicant’s program and academic year only (other years exist for other applicants).'
                    : 'Choose an applicant first.'
              }
            >
              {intakesForApplicant.map((i) => {
                const ay = i.academicYearId as AcademicYear | undefined;
                const yearPart = ay ? `${ay.label} (${ay.year})` : '—';
                return (
                  <MenuItem key={i._id} value={i._id}>
                    {(i.programId as { branchCode?: string })?.branchCode} / {yearPart}
                  </MenuItem>
                );
              })}
            </TextField>
            {selectedIntake && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Remaining:{' '}
                  {selectedIntake.quotas.map((q) => (
                    <span key={q.quotaType} style={{ marginRight: 8 }}>
                      {q.quotaType}: {q.seats - q.filled}
                    </span>
                  ))}
                  · Super left: {(selectedIntake.supernumeraryTotal || 0) - (selectedIntake.supernumeraryFilled || 0)}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={600} gutterBottom>
            Government flow (KCET / COMEDK)
          </Typography>
          <Stack component="form" spacing={2} onSubmit={allocateGov} maxWidth={480}>
            <TextField label="Allotment number" value={allotmentNumber} onChange={(e) => setAllotmentNumber(e.target.value)} required />
            <TextField select label="Quota" value={govQuota} onChange={(e) => setGovQuota(e.target.value as 'KCET' | 'COMEDK')}>
              <MenuItem value="KCET">KCET</MenuItem>
              <MenuItem value="COMEDK">COMEDK</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" color="primary">
              Allocate (government)
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={600} gutterBottom>
            Management quota flow
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Uses the <strong>Management</strong> seat quota on the intake — not the &quot;Management&quot; dashboard user. Only{' '}
            <strong>Admission Officer</strong> accounts can run this.
          </Typography>
          <Stack component="form" spacing={2} onSubmit={allocateMgmt} maxWidth={480}>
            <Button type="submit" variant="contained" color="secondary">
              Allocate Management quota
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={600} gutterBottom>
            Confirm admission (after docs verified + fee paid)
          </Typography>
          <Stack component="form" spacing={2} onSubmit={confirm} maxWidth={480}>
            <Button type="submit" variant="contained" color="success">
              Generate admission number &amp; confirm
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

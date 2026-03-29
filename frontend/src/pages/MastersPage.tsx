import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { AcademicYear, Campus, Department, Institution, Program } from '../types';

const cardSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
};

export function MastersPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [inst, camp, dept, prog, yr] = await Promise.all([
        api<Institution[]>('/masters/institutions'),
        api<Campus[]>('/masters/campuses'),
        api<Department[]>('/masters/departments'),
        api<Program[]>('/masters/programs'),
        api<AcademicYear[]>('/masters/academic-years'),
      ]);
      setInstitutions(inst);
      setCampuses(camp);
      setDepartments(dept);
      setPrograms(prog);
      setYears(yr);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load master data', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    setPage(0);
    setSearch('');
  }, [tab]);

  const [instForm, setInstForm] = useState({ name: '', code: '', jkCapTotal: '' });
  const [campForm, setCampForm] = useState({ institutionId: '', name: '', code: '' });
  const [deptForm, setDeptForm] = useState({ campusId: '', name: '', code: '' });
  const [progForm, setProgForm] = useState({
    departmentId: '',
    name: '',
    branchCode: '',
    courseType: 'UG' as Program['courseType'],
    entryType: 'Regular' as Program['entryType'],
    admissionMode: 'Government' as Program['admissionMode'],
  });
  const [yearForm, setYearForm] = useState({ label: '', year: String(new Date().getFullYear()) });

  const openAddDialog = () => {
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  async function submitInst(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/masters/institutions', {
        method: 'POST',
        body: JSON.stringify({
          name: instForm.name,
          code: instForm.code,
          jkCapTotal: instForm.jkCapTotal ? Number(instForm.jkCapTotal) : null,
        }),
      });
      setInstForm({ name: '', code: '', jkCapTotal: '' });
      closeDialog();
      loadAll();
      showToast('Institution saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save institution', 'error');
    }
  }

  async function submitCampus(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/masters/campuses', { method: 'POST', body: JSON.stringify(campForm) });
      setCampForm({ institutionId: campForm.institutionId, name: '', code: '' });
      closeDialog();
      loadAll();
      showToast('Campus saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save campus', 'error');
    }
  }

  async function submitDept(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/masters/departments', { method: 'POST', body: JSON.stringify(deptForm) });
      setDeptForm({ campusId: deptForm.campusId, name: '', code: '' });
      closeDialog();
      loadAll();
      showToast('Department saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save department', 'error');
    }
  }

  async function submitProg(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/masters/programs', { method: 'POST', body: JSON.stringify(progForm) });
      setProgForm((f) => ({ ...f, name: '', branchCode: '' }));
      closeDialog();
      loadAll();
      showToast('Program saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save program', 'error');
    }
  }

  async function submitYear(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/masters/academic-years', {
        method: 'POST',
        body: JSON.stringify({ label: yearForm.label, year: Number(yearForm.year), isActive: true }),
      });
      setYearForm({ label: '', year: String(new Date().getFullYear()) });
      closeDialog();
      loadAll();
      showToast('Academic year saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save academic year', 'error');
    }
  }

  const filteredInstitutions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(q));
  }, [institutions, search]);

  const filteredCampuses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter((c) => {
      const inst = typeof c.institutionId === 'object' && c.institutionId ? (c.institutionId as Institution).name : '';
      return `${c.name} ${c.code} ${inst}`.toLowerCase().includes(q);
    });
  }, [campuses, search]);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => {
      const camp = typeof d.campusId === 'object' && d.campusId ? (d.campusId as Campus).name : '';
      return `${d.name} ${d.code} ${camp}`.toLowerCase().includes(q);
    });
  }, [departments, search]);

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => {
      const dept = typeof p.departmentId === 'object' && p.departmentId ? (p.departmentId as Department).name : '';
      return `${p.name} ${p.branchCode} ${p.courseType} ${dept}`.toLowerCase().includes(q);
    });
  }, [programs, search]);

  const filteredYears = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return years;
    return years.filter((y) => `${y.label} ${y.year}`.toLowerCase().includes(q));
  }, [years, search]);

  const currentRows = [filteredInstitutions, filteredCampuses, filteredDepartments, filteredPrograms, filteredYears][tab];
  const paginatedRows = currentRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const tabLabels = ['Institutions', 'Campuses', 'Departments', 'Programs', 'Academic years'];
  const addButtonLabels = ['Institution', 'Campus', 'Department', 'Program', 'Academic year'];
  const emptyColSpans = [4, 3, 3, 4, 3];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(13, 71, 161, 0.3)',
              }}
            >
              <AdminPanelSettingsIcon />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
                Master setup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure hierarchy: institution → campus → department → program, plus academic years.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              <strong>{institutions.length}</strong> institutions · <strong>{campuses.length}</strong> campuses ·{' '}
              <strong>{programs.length}</strong> programs
            </Typography>
          </Stack>
        </Stack>

        <Card elevation={0} sx={cardSx}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
                '& .Mui-selected': { color: 'primary.main' },
              }}
            >
              {tabLabels.map((label, i) => (
                <Tab key={label} label={label} />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ pt: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2}>
              <TextField
                size="small"
                placeholder={`Search ${tabLabels[tab].toLowerCase()}…`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: { sm: 280 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                Add {addButtonLabels[tab]}
              </Button>
            </Stack>

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {tab === 0 && (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>J&amp;K cap</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </>
                    )}
                    {tab === 1 && (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
                      </>
                    )}
                    {tab === 2 && (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                      </>
                    )}
                    {tab === 3 && (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      </>
                    )}
                    {tab === 4 && (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tab === 0 &&
                    paginatedRows.map((row) => {
                      const i = row as Institution;
                      return (
                        <TableRow key={i._id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{i.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={i.code} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>{i.jkCapTotal != null ? i.jkCapTotal : '—'}</TableCell>
                          <TableCell>
                            <Chip label="Active" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {tab === 1 &&
                    paginatedRows.map((row) => {
                      const c = row as Campus;
                      const inst = typeof c.institutionId === 'object' && c.institutionId ? (c.institutionId as Institution) : null;
                      return (
                        <TableRow key={c._id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{c.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={c.code} size="small" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{inst?.name ?? '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  {tab === 2 &&
                    paginatedRows.map((row) => {
                      const d = row as Department;
                      const camp = typeof d.campusId === 'object' && d.campusId ? (d.campusId as Campus) : null;
                      return (
                        <TableRow key={d._id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{d.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={d.code} size="small" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{camp?.name ?? '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  {tab === 3 &&
                    paginatedRows.map((row) => {
                      const p = row as Program;
                      const dept = typeof p.departmentId === 'object' && p.departmentId ? (p.departmentId as Department) : null;
                      return (
                        <TableRow key={p._id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{p.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={p.branchCode} color="secondary" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Chip label={p.courseType} size="small" />
                              <Chip label={p.entryType} size="small" variant="outlined" />
                              <Chip label={p.admissionMode} size="small" color="primary" variant="outlined" />
                            </Stack>
                          </TableCell>
                          <TableCell>{dept?.name ?? '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  {tab === 4 &&
                    paginatedRows.map((row) => {
                      const y = row as AcademicYear;
                      return (
                        <TableRow key={y._id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{y.label}</Typography>
                          </TableCell>
                          <TableCell>{y.year}</TableCell>
                          <TableCell>
                            <Chip
                              label={y.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={y.isActive ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {paginatedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={emptyColSpans[tab]} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          {search ? 'No rows match your search.' : 'No records yet. Use Add to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={currentRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </CardContent>
        </Card>

        {/* Add dialogs */}
        <Dialog open={dialogOpen && tab === 0} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>New institution</DialogTitle>
          <DialogContent>
            <Stack component="form" spacing={2} sx={{ mt: 1 }} id="form-inst" onSubmit={submitInst}>
              <TextField label="Name" value={instForm.name} onChange={(e) => setInstForm({ ...instForm, name: e.target.value })} required fullWidth />
              <TextField
                label="Code (admission prefix)"
                value={instForm.code}
                onChange={(e) => setInstForm({ ...instForm, code: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="J&K cap (optional)"
                type="number"
                value={instForm.jkCapTotal}
                onChange={(e) => setInstForm({ ...instForm, jkCapTotal: e.target.value })}
                helperText="Institution-wide cap across programs"
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" form="form-inst" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogOpen && tab === 1} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>New campus</DialogTitle>
          <DialogContent>
            <Stack component="form" spacing={2} sx={{ mt: 1 }} id="form-campus" onSubmit={submitCampus}>
              <TextField
                select
                label="Institution"
                value={campForm.institutionId}
                onChange={(e) => setCampForm({ ...campForm, institutionId: e.target.value })}
                required
                fullWidth
              >
                {institutions.map((i) => (
                  <MenuItem key={i._id} value={i._id}>
                    {i.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Campus name" value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} required fullWidth />
              <TextField label="Code" value={campForm.code} onChange={(e) => setCampForm({ ...campForm, code: e.target.value })} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" form="form-campus" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogOpen && tab === 2} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>New department</DialogTitle>
          <DialogContent>
            <Stack component="form" spacing={2} sx={{ mt: 1 }} id="form-dept" onSubmit={submitDept}>
              <TextField
                select
                label="Campus"
                value={deptForm.campusId}
                onChange={(e) => setDeptForm({ ...deptForm, campusId: e.target.value })}
                required
                fullWidth
              >
                {campuses.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required fullWidth />
              <TextField label="Code" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" form="form-dept" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogOpen && tab === 3} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>New program</DialogTitle>
          <DialogContent>
            <Stack component="form" spacing={2} sx={{ mt: 1 }} id="form-prog" onSubmit={submitProg}>
              <TextField
                select
                label="Department"
                value={progForm.departmentId}
                onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
                required
                fullWidth
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Program name" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })} required fullWidth />
              <TextField label="Branch code" value={progForm.branchCode} onChange={(e) => setProgForm({ ...progForm, branchCode: e.target.value })} required fullWidth />
              <TextField select label="Course type" value={progForm.courseType} onChange={(e) => setProgForm({ ...progForm, courseType: e.target.value as Program['courseType'] })} fullWidth>
                <MenuItem value="UG">UG</MenuItem>
                <MenuItem value="PG">PG</MenuItem>
              </TextField>
              <TextField select label="Entry type" value={progForm.entryType} onChange={(e) => setProgForm({ ...progForm, entryType: e.target.value as Program['entryType'] })} fullWidth>
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Lateral">Lateral</MenuItem>
              </TextField>
              <TextField
                select
                label="Admission mode"
                value={progForm.admissionMode}
                onChange={(e) => setProgForm({ ...progForm, admissionMode: e.target.value as Program['admissionMode'] })}
                fullWidth
              >
                <MenuItem value="Government">Government</MenuItem>
                <MenuItem value="Management">Management</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" form="form-prog" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogOpen && tab === 4} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>New academic year</DialogTitle>
          <DialogContent>
            <Stack component="form" spacing={2} sx={{ mt: 1 }} id="form-year" onSubmit={submitYear}>
              <TextField label="Label" value={yearForm.label} onChange={(e) => setYearForm({ ...yearForm, label: e.target.value })} placeholder="2026-27" required fullWidth />
              <TextField label="Year" type="number" value={yearForm.year} onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" form="form-year" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}

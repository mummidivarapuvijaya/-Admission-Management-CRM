import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { AcademicYear, Program, ProgramIntake } from '../types';

const defaultQuotas = [
  { quotaType: 'KCET' as const, seats: 40 },
  { quotaType: 'COMEDK' as const, seats: 30 },
  { quotaType: 'Management' as const, seats: 30 },
];

export function IntakesPage() {
  const { showToast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [intakes, setIntakes] = useState<ProgramIntake[]>([]);
  const [programId, setProgramId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [totalIntake, setTotalIntake] = useState('100');
  const [quotas, setQuotas] = useState(defaultQuotas);
  const [superNum, setSuperNum] = useState('0');

  function loadAll() {
    api<Program[]>('/masters/programs')
      .then(setPrograms)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load programs', 'error'));
    api<AcademicYear[]>('/masters/academic-years')
      .then(setYears)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load years', 'error'));
    api<ProgramIntake[]>('/program-intakes')
      .then(setIntakes)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load intakes', 'error'));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const ti = Number(totalIntake);
    const sum = quotas.reduce((a, q) => a + q.seats, 0);
    if (sum !== ti) {
      showToast(`Quota sum (${sum}) must equal total intake (${ti})`, 'error');
      return;
    }
    try {
      await api('/program-intakes', {
        method: 'POST',
        body: JSON.stringify({
          programId,
          academicYearId,
          totalIntake: ti,
          quotas: quotas.map((q) => ({ quotaType: q.quotaType, seats: q.seats })),
          supernumeraryTotal: Number(superNum) || 0,
        }),
      });
      loadAll();
      showToast('Program intake and quotas saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create intake', 'error');
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Seat matrix &amp; quotas</Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            New program intake
          </Typography>
          <Stack component="form" spacing={2} onSubmit={onCreate} maxWidth={560}>
            <TextField select label="Program" value={programId} onChange={(e) => setProgramId(e.target.value)} required>
              {programs.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name} ({p.branchCode})
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Academic year" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required>
              {years.map((y) => (
                <MenuItem key={y._id} value={y._id}>
                  {y.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Total intake" type="number" value={totalIntake} onChange={(e) => setTotalIntake(e.target.value)} required />
            {quotas.map((q, i) => (
              <TextField
                key={q.quotaType}
                label={`${q.quotaType} seats`}
                type="number"
                value={q.seats}
                onChange={(e) => {
                  const next = [...quotas];
                  next[i] = { ...next[i], seats: Number(e.target.value) || 0 };
                  setQuotas(next);
                }}
              />
            ))}
            <TextField label="Supernumerary seats (optional)" type="number" value={superNum} onChange={(e) => setSuperNum(e.target.value)} />
            <Button type="submit" variant="contained">
              Save intake
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Configured intakes (live counters)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Program</TableCell>
                <TableCell>Year</TableCell>
                <TableCell align="right">Intake</TableCell>
                <TableCell>Quotas (filled / seats)</TableCell>
                <TableCell>Super</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {intakes.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    {(row.programId as Program)?.name} ({(row.programId as Program)?.branchCode})
                  </TableCell>
                  <TableCell>{(row.academicYearId as AcademicYear)?.label}</TableCell>
                  <TableCell align="right">{row.totalIntake}</TableCell>
                  <TableCell>
                    {row.quotas.map((q) => (
                      <span key={q.quotaType} style={{ marginRight: 12 }}>
                        {q.quotaType}: {q.filled}/{q.seats}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>
                    {row.supernumeraryFilled || 0}/{row.supernumeraryTotal || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { AcademicYear, DashboardSummary } from '../types';

const ACCENT = {
  purple: '#7c3aed',
  orange: '#ea580c',
  blue: '#2563eb',
  teal: '#0d9488',
  pink: '#db2777',
};

const PIE_COLORS = [ACCENT.purple, ACCENT.orange, ACCENT.blue];

function defaultAcademicYearId(years: AcademicYear[]): string {
  if (years.length === 0) return '';
  const calendarYear = new Date().getFullYear();
  const exact = years.find((y) => y.year === calendarYear);
  if (exact) return exact._id;
  const active = years.find((y) => y.isActive);
  if (active) return active._id;
  const closest = [...years].sort((a, b) => Math.abs(a.year - calendarYear) - Math.abs(b.year - calendarYear))[0];
  return closest._id;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.1)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: iconBg,
              color: '#fff',
              boxShadow: `0 8px 16px ${iconBg}44`,
            }}
          >
            {icon}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ my: 0.25, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip
                label={trend}
                size="small"
                sx={{
                  mt: 1,
                  height: 22,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  bgcolor: 'success.light',
                  color: 'success.dark',
                }}
              />
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState<string>('');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const firstName = user?.name?.split(/\s+/)[0] ?? 'there';

  useEffect(() => {
    api<AcademicYear[]>('/masters/academic-years')
      .then((y) => {
        setYears(y);
        setYearId((prev) => prev || defaultAcademicYearId(y));
      })
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load years', 'error'));
  }, [showToast]);

  useEffect(() => {
    if (!yearId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<DashboardSummary>(`/dashboard/summary?academicYearId=${encodeURIComponent(yearId)}`)
      .then(setData)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, [yearId, showToast]);

  const barData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.quotaTotals).map(([name, v]) => ({
      name,
      Filled: v.filled,
      Available: Math.max(0, v.seats - v.filled),
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.quotaTotals)
      .filter(([, v]) => v.filled > 0)
      .map(([name, v]) => ({ name, value: v.filled }));
  }, [data]);

  const fillPercent = useMemo(() => {
    if (!data || data.totalIntake <= 0) return 0;
    return Math.min(100, Math.round((data.seatsFilledInQuotas / data.totalIntake) * 100));
  }, [data]);

  const filteredIntakeRows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.intakes;
    return data.intakes.filter((row) => {
      const n = `${row.program?.name ?? ''} ${row.program?.branchCode ?? ''}`.toLowerCase();
      return n.includes(q);
    });
  }, [data, search]);

  const yearLabel = years.find((y) => y._id === yearId)?.label ?? '';

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {loading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 64,
            left: { xs: 0, md: 260 },
            right: 0,
            zIndex: 10,
            borderRadius: 0,
          }}
        />
      )}

      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                fontSize: '1.25rem',
                fontWeight: 700,
                boxShadow: '0 8px 20px rgba(13, 71, 161, 0.35)',
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em">
                  Welcome back, {firstName}
                </Typography>
                <WavingHandIcon sx={{ color: 'warning.main', fontSize: 28 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'management' ? 'Management' : user?.role?.replace('_', ' ') ?? 'User'} · {yearLabel || 'Select year'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              placeholder="Search programs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { sm: 220 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Academic year</InputLabel>
              <Select label="Academic year" value={yearId} onChange={(e) => setYearId(e.target.value as string)}>
                {years.map((y) => (
                  <MenuItem key={y._id} value={y._id}>
                    {y.label} ({y.year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {data && (
          <>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 4,
                background: `linear-gradient(125deg, ${ACCENT.purple} 0%, ${ACCENT.pink} 45%, #f97316 100%)`,
                color: '#fff',
                boxShadow: '0 16px 48px rgba(124, 58, 237, 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -40,
                  right: -20,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.12)',
                }}
              />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2, fontWeight: 600 }}>
                  Admissions overview
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, mb: 1, letterSpacing: '-0.04em' }}>
                  Hey, {firstName}! 👋
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 520, mb: 2 }}>
                  {data.totalAdmitted} confirmed of {data.totalIntake} total intake seats · {fillPercent}% base quota utilization
                  {data.supernumeraryRemaining > 0 ? ` · ${data.supernumeraryRemaining} supernumerary left` : ''}.
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`${data.seatsFilledInQuotas} seats allocated`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                  />
                  <Chip
                    label={`${data.pendingDocumentsCount} pending documents`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}
                  />
                </Stack>
              </Box>
            </Paper>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Total intake"
                  value={data.totalIntake}
                  subtitle="Configured seats"
                  icon={<SchoolIcon />}
                  iconBg={ACCENT.purple}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Confirmed"
                  value={data.totalAdmitted}
                  subtitle="Fee paid & issued #"
                  icon={<VerifiedIcon />}
                  iconBg={ACCENT.teal}
                  trend={data.totalIntake ? `${Math.round((data.totalAdmitted / data.totalIntake) * 100)}% of intake` : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Seats filled"
                  value={data.seatsFilledInQuotas}
                  subtitle="Across all quotas"
                  icon={<EventSeatIcon />}
                  iconBg={ACCENT.orange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Remaining (base)"
                  value={data.remainingSeatsOverall}
                  subtitle="Before supernumerary"
                  icon={<HourglassEmptyIcon />}
                  iconBg={ACCENT.blue}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={700}>
                        Quota seat matrix
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Filled vs available by quota
                      </Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                          />
                          <Legend />
                          <Bar dataKey="Filled" stackId="a" fill={ACCENT.purple} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Available" stackId="a" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={2.5} height="100%">
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                      flex: 1,
                    }}
                  >
                    <CardContent sx={{ p: 2.5, height: '100%' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Intake progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Base seats allocated vs total intake
                      </Typography>
                      <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ my: 1 }}>
                        {fillPercent}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={fillPercent}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: `linear-gradient(90deg, ${ACCENT.purple}, ${ACCENT.blue})`,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                        {data.seatsFilledInQuotas} of {data.totalIntake} base seats
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                      flex: 1,
                      minHeight: 260,
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Filled by quota
                      </Typography>
                      <Box sx={{ width: '100%', height: 200 }}>
                        {pieData.length === 0 ? (
                          <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
                            No allocations yet
                          </Typography>
                        ) : (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={72}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Box>
                      <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                        {pieData.map((d, i) => (
                          <Chip
                            key={d.name}
                            size="small"
                            label={`${d.name}: ${d.value}`}
                            sx={{
                              bgcolor: `${PIE_COLORS[i % PIE_COLORS.length]}22`,
                              fontWeight: 600,
                              border: 'none',
                            }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <DescriptionIcon color="warning" />
                      <Typography variant="h6" fontWeight={700}>
                        Pending documents
                      </Typography>
                    </Stack>
                    <Typography variant="h2" fontWeight={800} color="warning.dark">
                      {data.pendingDocumentsCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Allocated or confirmed applicants awaiting verification
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <PaymentsIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>
                        Fee pending
                      </Typography>
                    </Stack>
                    <Typography variant="h2" fontWeight={800} color="primary.main">
                      {data.feePendingApplicants.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sample list (up to 50) — mark paid to enable confirmation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ pb: 0 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Program &amp; quota breakdown
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Live remaining seats per program intake
                </Typography>
              </CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Quota</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Fill
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Remaining
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredIntakeRows.flatMap((row) =>
                      row.remainingByQuota.map((q) => {
                        const ratio = q.seats > 0 ? q.filled / q.seats : 0;
                        const status =
                          ratio >= 1 ? 'Full' : ratio >= 0.7 ? 'High' : ratio > 0 ? 'Open' : 'Empty';
                        const color = ratio >= 1 ? 'error' : ratio >= 0.7 ? 'warning' : 'success';
                        return (
                          <TableRow key={`${row._id}-${q.quotaType}`} hover sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell>
                              <Typography fontWeight={600}>{row.program?.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.program?.branchCode}
                              </Typography>
                            </TableCell>
                            <TableCell>{q.quotaType}</TableCell>
                            <TableCell align="right">
                              {q.filled} / {q.seats}
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600} color={q.remaining === 0 ? 'error.main' : 'text.primary'}>
                                {q.remaining}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={status} size="small" color={color} variant={ratio >= 1 ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {filteredIntakeRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography color="text.secondary" align="center" py={3}>
                            No programs match your search
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Fee pending — quick list
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Applicant</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.feePendingApplicants.map((a) => (
                      <TableRow key={a._id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.300', color: 'grey.800', fontSize: '0.9rem' }}>
                              {a.firstName?.charAt(0)}
                              {a.lastName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600}>
                                {a.firstName} {a.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {a.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{a.programId?.branchCode ?? '—'}</TableCell>
                        <TableCell>
                          <Chip label="Fee pending" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.feePendingApplicants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="text.secondary" align="center" py={2}>
                            No fee-pending applicants in the sample
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </Box>
  );
}

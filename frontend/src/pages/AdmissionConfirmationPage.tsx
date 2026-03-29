import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TagIcon from '@mui/icons-material/Tag';
import PaidIcon from '@mui/icons-material/Paid';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { AcademicYear, Applicant, Program } from '../types';

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 1, px: 1 }}>
      <Box sx={{ color: 'primary.main', opacity: 0.9 }}>{icon}</Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textAlign="center">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} textAlign="center">
        {value}
      </Typography>
    </Stack>
  );
}

export function AdmissionConfirmationPage() {
  const { applicantId } = useParams<{ applicantId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!applicantId) {
      showToast('Missing applicant id', 'error');
      setLoadFailed(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    api<Applicant>(`/applicants/${applicantId}`)
      .then(setApplicant)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        showToast(msg, 'error');
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [applicantId, showToast]);

  const program = applicant?.programId as Program | undefined;
  const year = applicant?.academicYearId as AcademicYear | undefined;

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        backgroundColor: '#eef1f5',
        backgroundImage: `
          linear-gradient(rgba(13, 71, 161, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(13, 71, 161, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
      }}
    >
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {!loading && loadFailed && (
        <Paper elevation={4} sx={{ p: 4, maxWidth: 440, borderRadius: 3, textAlign: 'center' }}>
          <Typography color="error" fontWeight={600} gutterBottom>
            Could not load this applicant.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Check the toast message for details.
          </Typography>
          <Button component={Link} to="/app/applicants" variant="contained">
            Back to applicants
          </Button>
        </Paper>
      )}

      {!loading && !loadFailed && applicant && (
        <Paper
          elevation={8}
          sx={{
            maxWidth: 520,
            width: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <IconButton
            aria-label="close"
            onClick={() => navigate('/app/applicants')}
            sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ pt: 3, pb: 1, textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
              <SchoolOutlinedIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h6" fontWeight={800} color="primary.main">
                Admission CRM
              </Typography>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'primary.main',
                  boxShadow: '0 12px 28px rgba(13, 71, 161, 0.35)',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 44, color: 'common.white' }} />
              </Avatar>
            </Box>

            {applicant.admissionStatus === 'Confirmed' && applicant.admissionNumber ? (
              <>
                <Typography variant="h5" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                  Admission confirmed!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: 3, mb: 2 }}>
                  The student is officially admitted. The admission number below is unique and permanent.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container sx={{ px: 1 }}>
                  <Grid size={{ xs: 4 }}>
                    <SummaryItem
                      icon={<PersonOutlineIcon fontSize="medium" />}
                      label="Student"
                      value={`${applicant.firstName} ${applicant.lastName}`}
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <SummaryItem
                      icon={<SchoolOutlinedIcon fontSize="medium" />}
                      label="Program"
                      value={program?.name ? `${program.name} (${program.branchCode})` : program?.branchCode ?? '—'}
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <SummaryItem
                      icon={<TagIcon fontSize="medium" />}
                      label="Quota"
                      value={applicant.seatLockedQuota || applicant.quotaType}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ px: 3, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                    Admission number
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      letterSpacing: '0.02em',
                      color: 'primary.dark',
                      wordBreak: 'break-all',
                    }}
                  >
                    {applicant.admissionNumber}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2, justifyContent: 'center' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PaidIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="success.dark" fontWeight={600}>
                        Fee: {applicant.feeStatus}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <VerifiedUserIcon color="info" fontSize="small" />
                      <Typography variant="body2" color="info.dark" fontWeight={600}>
                        Documents: {applicant.documentStatus}
                      </Typography>
                    </Stack>
                  </Stack>
                  {year && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                      Academic year: {year.label} ({year.year})
                    </Typography>
                  )}
                </Box>

                <Divider />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2.5, bgcolor: 'grey.50' }}>
                  <Button fullWidth variant="contained" size="large" component={Link} to="/app/applicants" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                    Back to applicants
                  </Button>
                  <Button fullWidth variant="outlined" size="large" component={Link} to="/app/allocation" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                    Seat allocation
                  </Button>
                </Stack>
              </>
            ) : (
              <Card elevation={0} sx={{ mx: 3, mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Not confirmed yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This applicant must be <strong>Allocated</strong>, have documents <strong>Verified</strong>, fee <strong>Paid</strong>, then use{' '}
                  <strong>Seat allocation</strong> → Generate admission number &amp; confirm.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button variant="contained" component={Link} to="/app/allocation">
                    Go to allocation
                  </Button>
                  <Button variant="outlined" component={Link} to="/app/applicants">
                    Applicants
                  </Button>
                </Stack>
              </Card>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

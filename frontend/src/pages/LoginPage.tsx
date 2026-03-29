import React, { useState } from 'react';
import {
  Box,
  Button,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useNavigate } from 'react-router-dom';
import { defaultHomePathForRole } from '../config/roleAccess';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function LoginIllustration() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        height: 360,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          height: 12,
          borderRadius: 6,
          bgcolor: 'primary.light',
          opacity: 0.35,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 100,
          borderRadius: 2,
          bgcolor: 'primary.main',
          opacity: 0.12,
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 140,
          height: 90,
          borderRadius: 1,
          bgcolor: '#fff',
          boxShadow: '0 8px 32px rgba(13, 71, 161, 0.12)',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack alignItems="center" spacing={0.5}>
          <SchoolOutlinedIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            CRM
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ position: 'absolute', top: 40, left: 20, color: 'primary.main', opacity: 0.5 }}>
        <AnalyticsOutlinedIcon sx={{ fontSize: 40 }} />
      </Box>
      <Box sx={{ position: 'absolute', top: 80, right: 30, color: 'primary.main', opacity: 0.4 }}>
        <DescriptionOutlinedIcon sx={{ fontSize: 36 }} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 140,
          right: 40,
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'secondary.light',
          opacity: 0.25,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 100,
          left: 24,
          width: 40,
          height: 64,
          borderRadius: 1,
          bgcolor: 'success.light',
          opacity: 0.35,
        }}
      />
    </Box>
  );
}

export function LoginPage() {
  const { login, register, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (user) navigate(defaultHomePathForRole(user.role), { replace: true });
  }, [user, navigate]);

  function switchMode(next: 'login' | 'signup') {
    setMode(next);
    if (next === 'login') {
      setName('');
      setConfirmPassword('');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
    }
    setBusy(true);
    try {
      const nextUser =
        mode === 'login' ? await login(email, password) : await register(name.trim(), email, password);
      showToast(mode === 'login' ? 'Signed in successfully.' : 'Account created. Welcome!', 'success');
      navigate(defaultHomePathForRole(nextUser.role), { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : mode === 'login' ? 'Login failed' : 'Sign up failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Grid container sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 6,
          py: 4,
          bgcolor: '#fafbfc',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          color="primary.main"
          sx={{ mb: 1, letterSpacing: '-0.02em' }}
        >
          Admission Management
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400, mb: 4 }}>
          Configure programs, manage applicants, allocate seats by quota, and track admissions in one place.
        </Typography>
        <LoginIllustration />
        <Typography variant="caption" color="text.disabled" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Edumerge-style CRM demo
        </Typography>
      </Grid>

      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          py: { xs: 4, md: 6 },
          background: 'linear-gradient(160deg, #1565c0 0%, #0d47a1 55%, #0a3d91 100%)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            right: 20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: '8%',
            width: 120,
            height: 120,
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          }}
        />

        <Paper
          elevation={12}
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          }}
        >
          <Stack component="form" spacing={2.5} onSubmit={onSubmit} autoComplete="off">
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: '-0.03em' }}>
                {mode === 'login' ? 'Hello!' : 'Create account'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mode === 'login'
                  ? 'Admins configure programs; officers manage applicants and seats; management views the dashboard only.'
                  : 'Sign up as an admission officer. An admin must configure masters and quotas before you can process applicants.'}
              </Typography>
            </Box>

            {mode === 'signup' && (
              <TextField
                fullWidth
                required
                label="Full name"
                placeholder="Your name"
                name="adm-full-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                variant="outlined"
                inputProps={{ autoComplete: 'off' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}

            <TextField
              fullWidth
              required
              type="email"
              label="Email address"
              placeholder="name@institution.edu"
              name="adm-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              variant="outlined"
              inputProps={{ autoComplete: 'off' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              placeholder="••••••••"
              name="adm-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              variant="outlined"
              inputProps={{ autoComplete: 'off' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText={mode === 'signup' ? 'At least 6 characters' : undefined}
            />

            {mode === 'signup' && (
              <TextField
                fullWidth
                required
                type="password"
                label="Confirm password"
                placeholder="••••••••"
                name="adm-password-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="off"
                variant="outlined"
                inputProps={{ autoComplete: 'off' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={busy}
              sx={{
                py: 1.35,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 8px 24px rgba(13, 71, 161, 0.35)',
              }}
            >
              {busy ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : mode === 'login' ? 'Login' : 'Sign up'}
            </Button>

            <Box textAlign="center">
              {mode === 'login' ? (
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {}}
                  underline="hover"
                  sx={{ color: 'text.secondary', cursor: 'default' }}
                >
                  Forgot password?
                </Link>
              ) : null}
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link component="button" type="button" fontWeight={700} onClick={() => switchMode('signup')} sx={{ cursor: 'pointer' }}>
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link component="button" type="button" fontWeight={700} onClick={() => switchMode('login')} sx={{ cursor: 'pointer' }}>
                    Sign in
                  </Link>
                </>
              )}
            </Typography>

            {mode === 'login' && (
              <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ pt: 0.5 }}>
                Demo: <strong>admin@demo.edu</strong> / <strong>Demo@123</strong> — run <code>npm run seed</code> in backend if needed.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

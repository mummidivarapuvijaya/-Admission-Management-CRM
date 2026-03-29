import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navItemsForRole } from '../config/roleAccess';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

const NAV_ICONS = {
  dashboard: <DashboardIcon />,
  masters: <AdminPanelSettingsIcon />,
  intakes: <SchoolIcon />,
  applicants: <PeopleIcon />,
  allocation: <EventSeatIcon />,
} as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  admission_officer: 'Admission Officer',
  management: 'Management',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => {
    if (!user) return [];
    return navItemsForRole(user.role).map((def) => ({
      to: def.path,
      label: def.label,
      icon: NAV_ICONS[def.iconKey],
    }));
  }, [user]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} color="primary">
          Admission CRM
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={location.pathname === item.to}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          background: 'linear-gradient(90deg, #0d47a1 0%, #1565c0 100%)',
        }}
      >
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          {isSm && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap component="div">
            {user?.name}
          </Typography>
          {user && (
            <Chip
              label={ROLE_LABELS[user.role] ?? user.role}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'common.white',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#f1f5f9',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

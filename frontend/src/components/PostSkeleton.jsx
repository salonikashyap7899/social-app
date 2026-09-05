import { Card, CardContent, Box, Skeleton } from '@mui/material';

/** Placeholder shown while a feed page is in flight - keeps the layout from jumping. */
export default function PostSkeleton() {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width="35%" height={18} />
            <Skeleton width="20%" height={14} />
          </Box>
        </Box>
        <Skeleton sx={{ mt: 1.5 }} height={18} />
        <Skeleton width="80%" height={18} />
      </CardContent>
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 4 }} />
      </Box>
    </Card>
  );
}

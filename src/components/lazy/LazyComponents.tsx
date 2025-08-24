import React, { Suspense } from 'react';
import { GraphSkeleton, NodeSkeleton } from '@/components/ui/LoadingSkeleton';
import ErrorFallback from '@/components/ui/ErrorFallback';

// Lazy load heavy components
const LazyWorldGraph = React.lazy(() => import('@/components/WorldGraph'));
const LazyNodeCreationModal = React.lazy(() => import('@/components/NodeCreationModal'));
const LazyNodeEditPanel = React.lazy(() => import('@/components/NodeEditPanel'));
const LazyConnectionAnalyticsPanel = React.lazy(() => import('@/components/ConnectionAnalyticsPanel'));
const LazyImportExportModal = React.lazy(() => import('@/components/ui/ImportExportModal'));

// Lazy load timeline components
const LazyChronoForgeTimeline = React.lazy(() => import('@/components/timeline/ChronoForgeTimeline'));
const LazyTimelineCanvas = React.lazy(() => import('@/components/timeline/TimelineCanvas'));

// Lazy load node form components
const LazyCharacterForm = React.lazy(() => import('@/components/nodeForms/CharacterForm'));
const LazyFactionForm = React.lazy(() => import('@/components/nodeForms/FactionForm'));
const LazyCityForm = React.lazy(() => import('@/components/nodeForms/CityForm'));
const LazyEventForm = React.lazy(() => import('@/components/nodeForms/EventForm'));
const LazyLocationForm = React.lazy(() => import('@/components/nodeForms/LocationForm'));

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error; resetErrorBoundary?: () => void }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error; resetErrorBoundary?: () => void }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={() => this.setState({ hasError: false, error: undefined })} 
        />
      );
    }

    return this.props.children;
  }
}

// Wrapper components with suspense and error boundaries
export const WorldGraph = React.memo(React.forwardRef<any, React.ComponentProps<typeof LazyWorldGraph>>((props, ref) => (
  <LazyErrorBoundary>
    <Suspense fallback={<GraphSkeleton />}>
      <LazyWorldGraph {...props} ref={ref} />
    </Suspense>
  </LazyErrorBoundary>
)));

export const NodeCreationModal = React.memo<React.ComponentProps<typeof LazyNodeCreationModal>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
      <LazyNodeCreationModal {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const NodeEditPanel = React.memo<React.ComponentProps<typeof LazyNodeEditPanel>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4"><NodeSkeleton /></div>}>
      <LazyNodeEditPanel {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const ConnectionAnalyticsPanel = React.memo<React.ComponentProps<typeof LazyConnectionAnalyticsPanel>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4 text-gray-400">Loading analytics...</div>}>
      <LazyConnectionAnalyticsPanel {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const ImportExportModal = React.memo<React.ComponentProps<typeof LazyImportExportModal>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
      <LazyImportExportModal {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const ChronoForgeTimeline = React.memo<React.ComponentProps<typeof LazyChronoForgeTimeline>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="h-64 bg-gray-800 rounded flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
      <LazyChronoForgeTimeline {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const TimelineCanvas = React.memo<React.ComponentProps<typeof LazyTimelineCanvas>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="h-64 bg-gray-800 rounded flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
      <LazyTimelineCanvas {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

// Node form components
export const CharacterForm = React.memo<React.ComponentProps<typeof LazyCharacterForm>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4"><NodeSkeleton /></div>}>
      <LazyCharacterForm {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const FactionForm = React.memo<React.ComponentProps<typeof LazyFactionForm>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4"><NodeSkeleton /></div>}>
      <LazyFactionForm {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const CityForm = React.memo<React.ComponentProps<typeof LazyCityForm>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4"><NodeSkeleton /></div>}>
      <LazyCityForm {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const EventForm = React.memo<React.ComponentProps<typeof LazyEventForm>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4"><NodeSkeleton /></div>}>
      <LazyEventForm {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

export const LocationForm = React.memo<React.ComponentProps<typeof LazyLocationForm>>((props) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div className="p-4"><NodeSkeleton /></div>}>
      <LazyLocationForm {...props} />
    </Suspense>
  </LazyErrorBoundary>
));

WorldGraph.displayName = 'WorldGraph';
NodeCreationModal.displayName = 'NodeCreationModal';
NodeEditPanel.displayName = 'NodeEditPanel';
ConnectionAnalyticsPanel.displayName = 'ConnectionAnalyticsPanel';
ImportExportModal.displayName = 'ImportExportModal';
ChronoForgeTimeline.displayName = 'ChronoForgeTimeline';
TimelineCanvas.displayName = 'TimelineCanvas';
CharacterForm.displayName = 'CharacterForm';
FactionForm.displayName = 'FactionForm';
CityForm.displayName = 'CityForm';
EventForm.displayName = 'EventForm';
LocationForm.displayName = 'LocationForm';
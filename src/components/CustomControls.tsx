import React from 'react';
import { useReactFlow } from 'reactflow';
import { Grid3X3Icon, Minus, Plus, Hand, MousePointer2 } from 'lucide-react'; // Added icons for clarity

// The new props for interactivity
interface CustomControlsProps {
  snapToGrid: boolean;
  setSnapToGrid: (value: boolean) => void;
  isInteractive: boolean;
  setIsInteractive: (value: boolean) => void;
}

const CustomControls: React.FC<CustomControlsProps> = ({ snapToGrid, setSnapToGrid, isInteractive, setIsInteractive }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="react-flow__controls" style={{
      backgroundColor: "#1f2937",
      border: "1px solid #4b5563",
      borderRadius: "8px",
    }}>
      <button
        className="react-flow__controls-button"
        title="zoom in"
        aria-label="zoom in"
        onClick={() => zoomIn()}
      >
        <Plus size={16} />
      </button>
      <button
        className="react-flow__controls-button"
        title="zoom out"
        aria-label="zoom out"
        onClick={() => zoomOut()}
      >
        <Minus size={16} />
      </button>
      <button
        className="react-flow__controls-button"
        title="fit view"
        aria-label="fit view"
        onClick={() => fitView()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30"><path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path></svg>
      </button>

      {/* The new button toggles the `isInteractive` state */}
      <button
        className="react-flow__controls-button"
        title={isInteractive ? "Lock Interactivity" : "Unlock Interactivity"}
        aria-label="toggle interactivity"
        onClick={() => setIsInteractive(!isInteractive)}
        style={{
          color: isInteractive ? '#9ca3af' : '#2563eb', // Highlight when locked
        }}
      >
        {isInteractive ? <MousePointer2 size={16} /> : <Hand size={16} />}
      </button>

      {/* Your custom snap button */}
      <button
        className="react-flow__controls-button"
        title={snapToGrid ? "Disable Snap to Grid" : "Enable Snap to Grid"}
        aria-label="toggle snap to grid"
        onClick={() => setSnapToGrid(!snapToGrid)}
        style={{
          color: !snapToGrid ? '#9ca3af' : '#2563eb',
        }}
      >
        <Grid3X3Icon size={16} />
      </button>
    </div>
  );
};

export default CustomControls;
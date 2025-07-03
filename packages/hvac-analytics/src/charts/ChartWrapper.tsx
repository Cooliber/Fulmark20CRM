import React, { useEffect, useRef, useState } from 'react';

let Chart;

export const ChartWrapper: React.FC = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    import('chart.js').then((ChartModule) => {
      Chart = ChartModule.Chart;
      if (canvasRef.current) {
        const newChartInstance = new Chart(canvasRef.current, props);
        setChartInstance(newChartInstance);
      }
    });

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [props]);

  return <canvas ref={canvasRef} />;
};
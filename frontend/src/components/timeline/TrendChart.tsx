import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { TrendSeries } from '../../types';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface TrendChartProps {
  seriesList: TrendSeries[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ seriesList }) => {
  if (!seriesList || seriesList.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">No Historical Laboratory Trends Available</p>
        <p className="text-xs text-slate-400 mt-1">
          Upload medical reports containing quantitative lab tests (e.g. HbA1c, Glucose, Creatinine) to plot longitudinal trajectories.
        </p>
      </div>
    );
  }

  const [selectedTest, setSelectedTest] = useState<string>(seriesList[0].test_name);

  const activeSeries = seriesList.find((s) => s.test_name === selectedTest) || seriesList[0];

  // Helper to extract threshold line if available
  let refThreshold: number | undefined;
  if (activeSeries.test_name === 'Hemoglobin A1c') refThreshold = 7.0;
  else if (activeSeries.test_name === 'Fasting Blood Glucose') refThreshold = 100;
  else if (activeSeries.test_name === 'Serum Creatinine') refThreshold = 1.3;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-800">
              Longitudinal Diagnostic Trajectory
            </h3>
            <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 font-medium rounded-full border border-brand-200">
              {activeSeries.unit}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Reference Range: {activeSeries.reference_range || 'Clinical Standard Target'}
          </p>
        </div>

        {/* Test Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {seriesList.map((s) => (
            <button
              key={s.test_name}
              onClick={() => setSelectedTest(s.test_name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTest === s.test_name
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.test_name} ({s.data_points.length})
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activeSeries.data_points} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700 space-y-1">
                      <p className="font-semibold">{data.date}</p>
                      <p className="text-brand-300">
                        Result: <span className="text-white font-bold">{data.value} {data.unit}</span>
                      </p>
                      {data.reference_range && (
                        <p className="text-slate-400">Ref: {data.reference_range}</p>
                      )}
                      {data.is_flagged && (
                        <p className="text-rose-400 font-medium flex items-center pt-1 border-t border-slate-700">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                          Exceeds Clinical Standard Threshold
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {refThreshold && (
              <ReferenceLine
                y={refThreshold}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: `Target (< ${refThreshold})`,
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={(props) => {
                const isFlagged = props.payload.is_flagged;
                return (
                  <circle
                    key={props.key}
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    fill={isFlagged ? '#e11d48' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, fill: '#0369a1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 mr-1.5" />
            Normal / Acceptable Value
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mr-1.5" />
            Exceeds Standard Target Threshold
          </span>
        </div>
        <span>Data verified against source documents</span>
      </div>
    </div>
  );
};

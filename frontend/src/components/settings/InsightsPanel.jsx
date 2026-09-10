import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle } from 'lucide-react';

export const InsightsPanel = () => {
  const [period, setPeriod] = useState(() => {
    return localStorage.getItem('ig_insights_period') || '30days';
  });

  const chartData = [
    { day: '월', reach: 3800, height: 60 },
    { day: '화', reach: 4900, height: 78 },
    { day: '수', reach: 4100, height: 65 },
    { day: '목', reach: 5800, height: 92 },
    { day: '금', reach: 6300, height: 100 },
    { day: '토', reach: 5200, height: 82 },
    { day: '일', reach: 4700, height: 74 },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
            인사이트 개요
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            회원님의 콘텐츠 성과 및 오디언스 성장 지표입니다.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            localStorage.setItem('ig_insights_period', e.target.value);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <option value="7days">지난 7일</option>
          <option value="30days">지난 30일</option>
        </select>
      </div>

      {/* KPI Cards 3-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>도달한 계정</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>45.2K</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>+14.2% ↑</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>참여한 계정</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>8.9K</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>+8.5% ↑</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>총 팔로워</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>14.2K</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>+320명 ↑</div>
        </div>
      </div>

      {/* Visual Reach Bar Chart */}
      <div
        style={{
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>요일별 일간 도달 수</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>일 평균 4,970</div>
        </div>

        {/* Chart Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '10px' }}>
          {chartData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div
                style={{
                  width: '28px',
                  height: `${item.height}px`,
                  backgroundColor: 'var(--ig-primary-button)',
                  borderRadius: '6px 6px 2px 2px',
                  opacity: item.height === 100 ? 1 : 0.75,
                  transition: 'height 0.3s ease',
                }}
                title={`${item.day}요일: ${item.reach.toLocaleString()}명`}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audience Demographics */}
      <div
        style={{
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
          오디언스 통계
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>주요 연령대 (25 - 34세)</span>
              <span style={{ color: 'var(--text-secondary)' }}>48%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '48%', height: '100%', backgroundColor: 'var(--ig-primary-button)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>성별 분포 (여성 58% / 남성 42%)</span>
              <span style={{ color: 'var(--text-secondary)' }}>여성 우세</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '58%', height: '100%', backgroundColor: '#ec4899' }} />
              <div style={{ width: '42%', height: '100%', backgroundColor: '#3b82f6' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>상위 지역 (서울특별시)</span>
              <span style={{ color: 'var(--text-secondary)' }}>62%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '62%', height: '100%', backgroundColor: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

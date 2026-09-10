import React from 'react';
import { NavLink } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
      }}
    >
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>
        죄송합니다. 페이지를 사용할 수 없습니다.
      </h2>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        클릭하신 링크가 잘못되었거나 페이지가 삭제되었습니다.{' '}
        <NavLink to="/" style={{ color: 'var(--ig-link)', fontWeight: 600 }}>
          Instagram으로 돌아가기.
        </NavLink>
      </p>
    </div>
  );
};

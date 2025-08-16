
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
        <div className="h-4 w-4 rounded-sm bg-primary-foreground"></div>
      </div>
      <span className="text-xl font-semibold tracking-tight">VideoAI</span>
    </Link>
  );
};

export default Logo;

import React, { useState } from 'react';
import { Mail, ArrowLeft, Key, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // เพิ่ม import
import axios from 'axios';
import BG from '../../../assets/tower.jpeg';
import Logo from '../../../assets/Logotcc.png';

const ForgotPasswordFlow = () => { 
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

const handleEmailSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const res = await axios.post('/api1/account/otp/send', { email: email.trim().toLowerCase() });
    // ไม่สนใจ res.data.success เพราะ backend แอบตอบเหมือนกันทุกกรณี
    setStep('otp');
  }  catch (err) {
    setError('Something went wrong. Please try again.');
  }
 finally {
    setIsLoading(false);
  }
};

const handleOtpSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const res = await axios.post('/api1/account/otp/verify', {
      email: email.trim().toLowerCase(),
      otp_code: otp
    });
    if (res.data.reset_token) {
      setResetToken(res.data.reset_token);
      setStep('reset');
    } else {
      setError(res.data.message || 'Invalid OTP. Please try again.');
    }
  } catch (err) {
    setError('Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


const handlePasswordReset = async (e) => {
  e.preventDefault();
  setError('');
  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  if (newPassword.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  setIsLoading(true);
  try {
    const res = await axios.post('/api1/account/otp/reset', {
      reset_token: resetToken,
      new_password: newPassword
    });
    alert(res.data.message || 'Password reset successfully!');
    navigate('/'); 
  } catch (err) {
    setError('Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // ...existing renderEmailStep, renderOtpStep, renderResetStep functions...


  // step 1 กรอกอีเมล
  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500"
            placeholder="Enter your email address"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Sending OTP...
          </div>
        ) : (
          <>
            <Mail className="w-5 h-5 mr-2" />
            Send OTP
          </>
        )}
      </button>
    </form>
  );

  // step 2 กรอก OTP
  const renderOtpStep = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-6">
      <div className="text-center mb-4">
        {/* <p className="text-sm text-gray-600 mb-2">
          We've sent a 6-digit code to <strong>{email}</strong>
        </p> */}
      </div>

      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="otp"
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg tracking-widest bg-gray-50 text-gray-900 placeholder-gray-500"
            placeholder="000000"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Verifying...
          </div>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Verify OTP
          </>
        )}
      </button>
    </form>
  );

  // step 3 กรอกพาสเวิร์ดใหม่
  const renderResetStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="newPassword"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500"
            placeholder="Enter new password"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Resetting...
          </div>
        ) : (
          <>
            <Key className="w-5 h-5 mr-2" />
            Reset Password
          </>
        )}
      </button>
    </form>
  );
//เปลี่ยน icon
  const getStepIcon = () => {
    switch (step) {
      case 'email':
        return <Mail className="w-8 h-8 text-blue-600" />;
      case 'otp':
        return <Shield className="w-8 h-8 text-blue-600" />;
      case 'reset':
        return <Key className="w-8 h-8 text-blue-600" />;
      default:
        return <Mail className="w-8 h-8 text-blue-600" />;
    }
  };
//เปลี่ยนชื่อ step
  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'Forgot Password';
      case 'otp':
        return 'Verify OTP';
      case 'reset':
        return 'Reset Password';
      default:
        return 'Forgot Password';
    }
  };
//เปลี่ยน subtitle ของแต่ละ step
  const getStepSubtitle = () => {
  switch (step) {
    case 'email':
      return 'Enter your email to receive an OTP';
    case 'otp':
      return <>We've sent a 6-digit code to <strong>{email}</strong></>;
    case 'reset':
      return 'Create a new secure password';
    default:
      return 'Enter your email to receive an OTP';
  }
};

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Logo */}
      <div className="hidden lg:flex flex-1 bg-[#0398fc] items-center justify-center p-8">
        <img src={Logo} alt="Logo" className="w-auto h-80 mx-auto mb-4" />
      </div>

      {/* Right Side - Form */}
      <div 
        className="flex-1 relative flex items-center justify-center p-8"
        style={{
          backgroundImage: `url('${BG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Form */}
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getStepIcon()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{getStepTitle()}</h1>
            <p className="text-gray-600 text-sm">{getStepSubtitle()}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'reset' && renderResetStep()}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordFlow;
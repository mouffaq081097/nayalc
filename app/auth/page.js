'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Using next/image instead of ImageWithFallback

// Import your UI components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Import your local Icon component
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, XCircle } from 'lucide-react'; // Import XCircle
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal'; // Import the Modal component

import { NayaLumiereLogo } from '../components/Icons'; // Import NayaLumiereLogo

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false); // State for error modal
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  // State for spotlight effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null); // Ref to track image container

  const router = useRouter();
  const { login, register } = useAuth(); // Assuming useAuth provides login and register functions

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(signInData.email, signInData.password);
    } catch (error) {
      setErrorMessage(error.message || "Login failed");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await register(signUpData.username, signUpData.email, signUpData.password, signUpData.firstName, signUpData.lastName);
      alert('Account created successfully! Please sign in.');
      // Optionally switch to signin tab after successful registration
      // document.getElementById('signin-tab-trigger').click(); // This is a hacky way, better to control via state
    } catch (error) {
      alert(error.message); // Display error message
    }
  };

  const handleBackClick = () => {
    router.push('/'); // Navigate back to the home page
  };

  // Map lucide-react icon names to local Icon component names
  const getIconComponent = (lucideIconName) => {
    switch (lucideIconName) {
      case 'Mail': return Mail;
      case 'Lock': return Lock;
      case 'User': return User;
      case 'ArrowLeft': return ArrowLeft;
      case 'Eye': return Eye;
      case 'EyeOff': return EyeOff;
      default: return null;
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] relative overflow-hidden">
          {/* Floating Shapes */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-brand-blue-light opacity-30 animate-float-slow z-0" style={{ animationDelay: '0s' }}></div>      <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-brand-pink-light opacity-30 animate-float-slow z-0" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full bg-brand-blue-extra-light opacity-30 animate-float-slow z-0" style={{ animationDelay: '4s' }}></div>
      <div className="absolute top-1/3 right-1/3 w-28 h-28 rounded-full bg-brand-pink-extra-light opacity-30 animate-float-slow z-0" style={{ animationDelay: '6s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-16 h-16 rounded-full bg-brand-blue-light opacity-30 animate-float-slow z-0" style={{ animationDelay: '8s' }}></div>
      {/* End Floating Shapes */}
      {/* Header */}
      <div className="bg-white border-b border-gray-100 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              {React.createElement(getIconComponent('ArrowLeft'), { className: "h-4 w-4 mr-2" })}
              Back to Store
            </Button>
            <div className="text-center flex-1">
              <NayaLumiereLogo className="h-8 w-auto mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <div className="hidden lg:block">
            <div
              ref={imageRef}
              onMouseMove={(e) => {
                if (imageRef.current) {
                  const { left, top, width, height } = imageRef.current.getBoundingClientRect();
                  const x = (e.clientX - left) / width * 100; // x as percentage
                  const y = (e.clientY - top) / height * 100; // y as percentage
                  setMousePosition({ x, y });
                }
              }}
              onMouseLeave={() => setMousePosition({ x: 0, y: 0 })} // Reset on mouse leave
              className="relative overflow-hidden rounded-2xl shadow-2xl"
            >
              <Image
                src="/Gemini_Generated_Image_1d4x5g1d4x5g1d4x.png"
                alt="Luxury beauty products"
                width={1080}
                height={600}
                className="w-full h-[600px] object-cover"
              />
              {/* Dynamic Overlay with Spotlight Effect */}
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background: mousePosition.x !== 0 || mousePosition.y !== 0
                    ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, transparent 5%, rgba(var(--brand-blue-rgb), 0.7) 30%, rgba(var(--brand-pink-rgb), 0.7))`
                    : 'linear-gradient(to top, rgba(var(--brand-blue-rgb), 0.8), rgba(var(--brand-pink-rgb), 0.6))',
                }}
              />
              <div className="absolute top-8 left-8 text-white pointer-events-none z-10">
                <p className="text-xl italic font-serif text-shadow-md">Naya Lumière</p>
                <h2 className="text-5xl font-bold mb-2 text-shadow-md">Unlocking Beauty</h2>
                <p className="text-lg text-shadow-md">Your journey to radiant skin starts here.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Forms */}
          <div className="w-full max-w-md mx-auto">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Sign in to your account to continue your beauty journey
                    </CardDescription>
                  </CardHeader>
                                     <CardContent>
                                       <form onSubmit={handleLogin} className="space-y-4">                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('Mail'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signInData.email}
                            onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('Lock'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signInData.password}
                            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {React.createElement(getIconComponent(showPassword ? 'EyeOff' : 'Eye'), { className: "h-4 w-4" })}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span>Remember me</span>
                        </label>
                        <a href="#" className="text-[var(--brand-pink)] hover:underline">
                          Forgot password?
                        </a>
                      </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white p-3 rounded-md hover:from-[var(--brand-pink)] hover:to-[var(--brand-blue)] transition duration-300 flex items-center justify-center"
            >
              {loading && <Spinner />}
              {loading ? "Loading..." : "Sign In"}
            </button>
                    </form>

                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </Button>
                        <Button variant="outline" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Join the Lumière family and discover exclusive beauty experiences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            {React.createElement(getIconComponent('User'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                            <Input
                              id="firstName"
                              placeholder="First name"
                              className="pl-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                              value={signUpData.firstName}
                              onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Last name"
                            className="focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signUpData.lastName}
                            onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('User'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="username"
                            placeholder="Username"
                            className="pl-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signUpData.username}
                            onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('Mail'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('Lock'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            className="pl-10 pr-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signUpData.password}
                            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {React.createElement(getIconComponent(showPassword ? 'EyeOff' : 'Eye'), { className: "h-4 w-4" })}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('Lock'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-10 focus:ring-2 focus:ring-pink-300 focus:border-transparent hover:shadow-md transition-all duration-200"
                            value={signUpData.confirmPassword}
                            onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <input type="checkbox" className="mt-1 rounded" required />
                        <div className="text-sm text-gray-600">
                          I agree to the{' '}
                          <a href="#" className="text-[var(--brand-pink)] hover:underline">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-[var(--brand-pink)] hover:underline">
                            Privacy Policy
                          </a>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:from-[var(--brand-pink)] hover:to-[var(--brand-blue)] transition-all duration-300"
                        size="lg"
                      >
                        Create Account
                      </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                      <label className="flex items-center justify-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-gray-600">Subscribe to newsletter for exclusive offers</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <ErrorModalContent
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </Modal>
    </div>
  );
}

// Custom error content for the modal
const ErrorModalContent = ({ message, onClose }) => (
  <div className="text-center p-4 relative overflow-hidden">
    <h3 className="text-2xl font-bold text-gray-800 mb-2">Oops, Something Went Wrong!</h3>

    {/* Stylized Error X CSS Emoji */}
    <div className="mx-auto mb-4 w-20 h-20 relative flex items-center justify-center">
      {/* Ripple Effect */}
      <div className="absolute w-16 h-16 rounded-full bg-red-500 animate-ripple-urgent opacity-0"></div>
      <div className="absolute w-16 h-16 rounded-full bg-red-500 flex items-center justify-center border-2 border-red-700">
        {/* X Mark */}
        <div className="absolute w-10 h-2 bg-white transform rotate-45"></div>
        <div className="absolute w-10 h-2 bg-white transform -rotate-45"></div>
      </div>
    </div>
    <p className="text-lg text-gray-700 mb-6">{message}</p>
    <Button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white">
      Got It
    </Button>
  </div>
);
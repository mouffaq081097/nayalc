'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Using next/image instead of ImageWithFallback

// Import your UI components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Import your local Icon component
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Assuming you'll use AuthContext for actual auth

export default function SignInPage() { // Changed to default export and removed onBackClick prop
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

  const router = useRouter();
  const { login, register } = useAuth(); // Assuming useAuth provides login and register functions

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await login(signInData.email, signInData.password);
      router.push('/'); // Redirect to home after successful login
    } catch (error) {
      alert(error.message); // Display error message
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              {React.createElement(getIconComponent('ArrowLeft'), { className: "h-4 w-4 mr-2" })}
              Back to Store
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-serif bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Naya Lumière
              </h1>
              <p className="text-xs text-gray-500 italic">Parisian Beauty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <div className="hidden lg:block">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1750271336429-8b0a507785c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiZWF1dHklMjBzcGElMjBwcm9kdWN0c3xlbnwxfHx8fDE3NTgzNTI5MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Luxury beauty products"
                width={1080} // Added width
                height={600} // Added height
                className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              <div className="absolute bottom-8 left-8 text-white">
                <h2 className="text-3xl mb-2">Welcome to Naya Lumière</h2>
                <p className="text-lg opacity-90">Discover French elegance in beauty</p>
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
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          {React.createElement(getIconComponent('Mail'), { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" })}
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
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
                            className="pl-10 pr-10"
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

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                        size="lg"
                      >
                        Sign In
                      </Button>
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
                              className="pl-10"
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
                            className="pl-10"
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
                            className="pl-10"
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
                            className="pl-10 pr-10"
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
                            className="pl-10"
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
                        className="w-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
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
    </div>
  );
}
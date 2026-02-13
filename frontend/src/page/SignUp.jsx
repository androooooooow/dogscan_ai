import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../api/axios';
import FootLogo from "../assets/FOOT.png";

const SignUp = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post("/api/auth/register", {
        name: fullname,
        email: email,
        password: password
      });
      
      // Redirect to sign in after successful registration
      navigate('/signin', { 
        state: { message: "Registration successful! Please sign in." } 
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-5xl min-h-[560px] bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[30%_70%]">

        {/* LEFT PANEL */}
        <div className="bg-blue-500 flex flex-col items-center justify-center px-6 text-white">
          <h2 className="text-3xl font-bold mb-6">Sign Up</h2>

          <div className="w-44 h-44 rounded-full bg-white flex items-center justify-center shadow-lg">
            <img
              src={FootLogo}
              alt="Mascot"
              className="w-70 h-70 object-contain"
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-wide">
              DOG <span className="text-blue-400">SCAN AI</span>
            </h1>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">

            {/* Full Name */}
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="text-blue-500 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>

          </form>
        </div>

      </div>
    </div>
  );
};

export default SignUp;
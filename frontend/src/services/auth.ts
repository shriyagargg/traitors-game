/**
 * Authentication Service for AI TRAITORS: The Architect
 * Manages client-side validation, typed credentials, and API connection adapter.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface PasswordEvaluation {
  score: number; // 0 to 4
  label: "Too Weak" | "Weak" | "Fair" | "Strong" | "Excellent";
  color: string;
  feedback: string;
}

/**
 * Validates email format using standard RFC 5322 regex pattern
 */
export function validateEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return pattern.test(email.trim());
}

/**
 * Evaluates password complexity and returns structured strength feedback
 */
export function evaluatePasswordStrength(password: string): PasswordEvaluation {
  if (!password) {
    return {
      score: 0,
      label: "Too Weak",
      color: "bg-zinc-700",
      feedback: "Password is required",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: "Weak",
      color: "bg-rose-500",
      feedback: "Use at least 8 characters with letters and numbers",
    };
  } else if (score === 2 || score === 3) {
    return {
      score: 2,
      label: "Fair",
      color: "bg-amber-400",
      feedback: "Add symbols or mix uppercase/lowercase letters",
    };
  } else if (score === 4) {
    return {
      score: 3,
      label: "Strong",
      color: "bg-emerald-400",
      feedback: "Strong password",
    };
  } else {
    return {
      score: 4,
      label: "Excellent",
      color: "bg-emerald-300",
      feedback: "Excellent cryptographic complexity",
    };
  }
}

/**
 * Client authentication adapter
 * Note: Connects to backend API when available; provides structured mock fallback during UI phase.
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: "Authentication successful",
        token: data.access_token,
        user: data.user,
      };
    }
  } catch {
    // Backend endpoint not yet active (Phase 2)
  }

  // Graceful client simulation with artificial delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!validateEmail(credentials.email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  if (credentials.password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters.",
    };
  }

  return {
    success: true,
    message: "Council credentials accepted (Simulated session for interface preview).",
    token: "mock-jwt-session-token",
    user: {
      id: "usr_mock_123",
      username: credentials.email.split("@")[0],
      email: credentials.email,
    },
  };
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: "Initiate registered successfully",
        user: data.user,
      };
    }
  } catch {
    // Backend endpoint not yet active (Phase 2)
  }

  await new Promise((resolve) => setTimeout(resolve, 850));

  if (!credentials.username || credentials.username.trim().length < 3) {
    return {
      success: false,
      message: "Username must be at least 3 characters.",
    };
  }

  if (!validateEmail(credentials.email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  if (credentials.password !== credentials.confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
    };
  }

  return {
    success: true,
    message: "New initiate registered (Simulated session for interface preview).",
    token: "mock-jwt-register-token",
    user: {
      id: "usr_mock_456",
      username: credentials.username.trim(),
      email: credentials.email,
    },
  };
}

export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!validateEmail(email)) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  return {
    success: true,
    message: `Password reset instructions have been dispatched to ${email}.`,
  };
}

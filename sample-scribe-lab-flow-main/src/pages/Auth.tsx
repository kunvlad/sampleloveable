
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";

const AuthPage = () => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  // Listen to auth state and get profile
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) return;
    setProfile(data);
    setUsername(data.username || "");
    setAvatarUrl(data.avatar_url || "");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Always set emailRedirectTo!
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Automatically insert default profile and role
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        avatar_url: avatarUrl || null,
      });
      await supabase.from("user_roles").upsert({
        user_id: data.user.id,
        role: "user",
      });
    }
    toast({ title: "Signup successful!", description: "Check your email to confirm your account." });
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    toast({ title: "Login successful!" });
    setLoading(false);
    // Will redirect automatically by effect
  };

  // Show a profile update form if logged in
  if (session && profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setLoading(true);
                const { error } = await supabase
                  .from("profiles")
                  .update({ username, avatar_url: avatarUrl })
                  .eq("id", session.user.id);
                if (error) {
                  toast({ title: "Update failed", description: error.message, variant: "destructive" });
                } else {
                  toast({ title: "Profile updated" });
                }
                setLoading(false);
              }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm">Username</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
              </div>
              <div>
                <label className="text-sm">Avatar</label>
                <UserAvatar
                  userId={session.user.id}
                  currentAvatarUrl={avatarUrl}
                  onAvatarUploaded={url => setAvatarUrl(url)}
                />
              </div>
              <Button type="submit" disabled={loading}>Save</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login/signup page
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Card>
        <CardHeader>
          <CardTitle>
            {authMode === "login" ? "Login" : "Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={authMode === "login" ? handleLogin : handleSignUp} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm">Email</label>
              <Input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Password</label>
              <Input required type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {authMode === "signup" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm">Username</label>
                <Input required value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            )}
            {authMode === "signup" && (
              <div>
                <label className="text-sm">Avatar (optional)</label>
                <UserAvatar userId="new" currentAvatarUrl={avatarUrl} onAvatarUploaded={setAvatarUrl} />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Loading..." : authMode === "login" ? "Login" : "Sign Up"}
            </Button>
            <Button variant="link" type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="w-full">
              {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;


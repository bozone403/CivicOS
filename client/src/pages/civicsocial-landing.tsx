import React from "react";
import { Link } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, MessageSquare, User, Sparkles } from "lucide-react";

export default function CivicSocialLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <Card className="max-w-xl w-full p-10 shadow-2xl border-2 border-blue-200 bg-white/80 dark:bg-slate-900/80 rounded-3xl fade-in-up flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-civic-blue to-civic-gold flex items-center justify-center shadow-lg mb-2">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-civic-blue mb-1 text-center font-serif">Welcome to CivicSocial</h1>
        </div>
        <p className="text-lg text-gray-700 mb-4 text-center">
          CivicSocial is your secure, real-time social layer for civic engagement, discussion, and collaboration. Connect with other verified citizens, share your voice, and stay informed.
        </p>
        <div className="flex flex-col gap-4 w-full">
          <Link href="/civicsocial/feed">
            <Button className="w-full flex items-center justify-center gap-2 text-lg bg-civic-blue hover:bg-civic-gold text-white font-bold rounded-xl shadow-md transition-all duration-150">
              <MessageSquare className="w-5 h-5" />
              Civic Feed
            </Button>
          </Link>
          <Link href="/civicsocial/profile">
            <Button className="w-full flex items-center justify-center gap-2 text-lg bg-civic-gold hover:bg-civic-blue text-white font-bold rounded-xl shadow-md transition-all duration-150">
              <User className="w-5 h-5" />
              My Profile
            </Button>
          </Link>
          <Link href="/civicsocial/friends">
            <Button className="w-full flex items-center justify-center gap-2 text-lg bg-civic-purple hover:bg-civic-blue text-white font-bold rounded-xl shadow-md transition-all duration-150">
              <Users className="w-5 h-5" />
              Friends & Connections
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
} 
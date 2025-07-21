import React from "react";
import { Link } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, MessageSquare, User } from "lucide-react";

export default function CivicSocialLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <Card className="max-w-xl w-full p-8 shadow-xl border-2 border-blue-200 bg-white">
        <h1 className="text-4xl font-bold text-blue-800 mb-4 text-center font-serif">Welcome to CivicSocial</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          CivicSocial is your secure, real-time social layer for civic engagement, discussion, and collaboration. Connect with other verified citizens, share your voice, and stay informed.
        </p>
        <div className="flex flex-col gap-4">
          <Link href="/civicsocial/feed">
            <Button className="w-full flex items-center justify-center gap-2 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              <MessageSquare className="w-5 h-5" />
              Civic Feed
            </Button>
          </Link>
          <Link href="/civicsocial/profile">
            <Button className="w-full flex items-center justify-center gap-2 text-lg bg-blue-500 hover:bg-blue-600 text-white">
              <User className="w-5 h-5" />
              My Profile
            </Button>
          </Link>
          <Link href="/civicsocial/friends">
            <Button className="w-full flex items-center justify-center gap-2 text-lg bg-blue-400 hover:bg-blue-500 text-white">
              <Users className="w-5 h-5" />
              Friends & Connections
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
} 
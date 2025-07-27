import React from 'react';
import UserSearch from '../components/UserSearch';
import { Layout } from '../components/Layout';

export default function UserSearchPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find CivicOS Users
            </h1>
            <p className="text-gray-600">
              Search for other civic-minded individuals to connect with and build your civic network.
            </p>
          </div>
          
          <UserSearch />
        </div>
      </div>
    </Layout>
  );
} 
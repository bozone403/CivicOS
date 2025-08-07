# 🚀 CivicSocial Database Setup Guide

## 📋 **What You Need to Do**

You have **two options** to set up the CivicSocial database tables:

### **Option 1: Run the Migration Script (Recommended)**

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Run the migration
./migrate-civicsocial.sh
```

### **Option 2: Manual SQL Execution**

Copy the contents of `migrations/0001_civicsocial_tables.sql` and run it directly in your Supabase SQL editor.

## 🗄️ **Database Tables Created**

### **social_posts**
- Stores all social posts and shares
- Links to users table
- Supports different post types (post, share, poll, event)

### **social_comments**
- Stores comments on posts
- Supports nested comments (replies)
- Links to posts and users

### **social_likes**
- Stores likes on posts and comments
- Prevents duplicate likes
- Tracks like timestamps

### **user_friends**
- Manages friend relationships
- Supports pending, accepted, blocked status
- Prevents duplicate relationships

## 🔧 **Features Enabled**

### **Social Feed**
- ✅ View all posts in chronological order
- ✅ Create new posts with text and images
- ✅ Share existing content (bills, politicians, etc.)

### **Comments System**
- ✅ Add comments to posts
- ✅ Nested replies to comments
- ✅ Real-time comment updates

### **Like System**
- ✅ Like/unlike posts and comments
- ✅ Like count tracking
- ✅ Prevent duplicate likes

### **Friend System**
- ✅ Send friend requests
- ✅ Accept/decline requests
- ✅ Remove friends
- ✅ View friend list and pending requests

## 🚀 **After Migration**

1. **Restart your server:**
   ```bash
   npm run build:full
   npm start
   ```

2. **Test the features:**
   - Visit `/civicsocial/feed` to see the social feed
   - Create a post to test the posting system
   - Try liking and commenting on posts

3. **API Endpoints Available:**
   - `GET /api/social/feed` - Get social feed
   - `POST /api/social/posts` - Create a post
   - `POST /api/social/posts/:id/comment` - Add comment
   - `POST /api/social/posts/:id/like` - Like/unlike post
   - `POST /api/social/friends` - Manage friends
   - `GET /api/social/friends` - Get friend list

## 🎯 **Sample Data Included**

The migration includes sample posts to get you started:
- Welcome message to CivicSocial
- Sample voting post
- Town hall meeting post

## 🔒 **Security Features**

- ✅ JWT authentication required for all endpoints
- ✅ User validation on all operations
- ✅ SQL injection protection via Drizzle ORM
- ✅ Input validation and sanitization
- ✅ Proper error handling and logging

## 📊 **Performance Optimized**

- ✅ Database indexes on all frequently queried columns
- ✅ Efficient queries with proper joins
- ✅ Pagination support (50 posts per feed)
- ✅ Automatic timestamp updates

## 🎉 **Ready to Use!**

Once you run the migration, CivicSocial will be fully functional with:
- Real database storage
- Complete social features
- Proper authentication
- Performance optimization
- Error handling

**Your CivicSocial platform will be production-ready!** 🚀 
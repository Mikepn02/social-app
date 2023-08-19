 "use server"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"
import User from "../models/user.model"
import { revalidatePath } from "next/cache"
import { NextApiResponse } from "next"

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export async function createThread({ text, author, communityId, path }: Params, res: NextApiResponse) {
   try {
     connectToDB();
     const createdThread = await Thread.create({
       text,
       author,
       community: null,
     });
 
     // Update user model
     await User.findByIdAndUpdate(author, {
       $push: { threads: createdThread._id },
     });
 
     revalidatePath(path);
 
     res.status(201).json({ message: 'Thread created successfully', threadId: createdThread._id });
   } catch (error: any) {
     res.status(500).json({ error: `Error creating thread: ${error.message}` });
   }
 }

 export async function fetchPosts(pageNumber = 1, pageSize = 20, res: NextApiResponse) {
   try {
     connectToDB();
 
     const skipAmount = (pageNumber - 1) * pageSize;
     const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
       .sort({ createdAt: 'desc' })
       .skip(skipAmount)
       .limit(pageSize)
       .populate({ path: 'author', model: User })
       .populate({
         path: 'children',
         populate: {
           path: 'author',
           model: User,
           select: '_id name parentId Image',
         },
       });
 
     const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });
     const posts = await postsQuery.exec();
     const isNext = totalPostsCount > skipAmount + posts.length;
 
     res.status(200).json({ posts, isNext });
   } catch (error: any) {
     res.status(500).json({ error: `Error fetching posts: ${error.message}` });
   }
 }

  export async function fetchThreadById(id: string, res: NextApiResponse) {
   connectToDB();
   try{
      const thread = await Thread.findById(id)
      .populate({
         path:"author",
         model:User,
         select:"_id id name image"
      })
      .populate({
         path:'children',
         populate: [
            {
               path: 'author',
               model: User,
               select:"_id id name parentId image"
            },
            {
               path: 'children',
               model:Thread,
               populate: {
                  path:"author",
                  model: User,
                  select:"_id id name parentId image"
               }
            }
           ]

      }).exec()
      res.status(200).json(thread)
   }catch(error : any) {
      console.log(`Error fetching thread: ${error}`)
      res.status(500).json({ error: `Error fetching posts: ${error.message}` });

   }
  }
  export async function addCommentToThread(
   threadId: string,
   commentText: string,
   userId: string,
   path: string,
   res: NextApiResponse
 ) {
   try {
     connectToDB();
 
     // Finding the original thread
     const originalThread = await Thread.findById(threadId);
 
     if (!originalThread) {
       return res.status(404).json({ error: "Thread not found" });
     }
 
     const commentThread = new Thread({
       text: commentText,
       author: userId,
       parentId: threadId,
     });
 
     const savedCommentThread = await commentThread.save();
     originalThread.children.push(savedCommentThread._id);
     await originalThread.save();
 
     revalidatePath(path);
 
     res.status(201).json({ message: 'Comment added successfully', commentId: savedCommentThread._id });
   } catch (error: any) {
     console.error(`Failed to add comment: ${error.message}`);
     res.status(500).json({ error: `Failed to add comment: ${error.message}` });
   }
 }

export async function fetchUserPosts(userId:string , res: NextApiResponse) {
    try{
      connectToDB()

      // all threads authored by user

      // Populate the community

      const threads = await  User.findOne({id: userId})
      .populate({
         path:'threads',
         model:Thread,
         populate:{
            path:'children',
            model:Thread,
            populate:{
               path:  'author',
               model:'User',
               select:"name image id"
            }
         }
      })

     res.status(200).json(threads)

    }catch(error: any) {
         console.log(`Failed to fetch the user: ${error.message}`)
         res.status(500).json({ error: `Failed to add comment: ${error.message}`})
    }
}
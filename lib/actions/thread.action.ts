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

export  async function createThread({text,author,communityId,path,} : Params,res:NextApiResponse) {
   try{
    connectToDB()
    const createdThread = await Thread.create({
       text,
       author,
       community: null
    })

    //update user model
   const user= await User.findByIdAndUpdate(author, {
        $push: {threads: createdThread._id}
    })
    revalidatePath(path)
    return res.status(200).json({ success: true, user});

   }catch(error : any) {
    console.log(`Error creating thread: ${error.message}`)
     return res.status(500).json({ success: false, error: 'Failed to fetch posts' });
   }
}

export async function fetchPosts(
   pageNumber = 1,
   pageSize = 20,
   res: NextApiResponse
 ) {
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
 
     const totalPostsCount = await Thread.countDocuments({
       parentId: { $in: [null, undefined] },
     });
     const posts = await postsQuery.exec();
     const isNext = totalPostsCount > skipAmount + posts.length;
 
     return res.status(200).json({ success: true, posts, isNext });
   } catch (error: any) {
     console.log(`Failed to fetch posts: ${error.message}`);
     
     // Return an error response
     return res.status(500).json({ success: false, error: 'Failed to fetch posts' });
   }
 }

  export async function fetchThreadById(id: string,res:NextApiResponse) {
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

      return res.status(200).json({ success: true, thread});
      
   }catch(error : any) {
      console.log(`Error fetching thread: ${error}`)
       return res.status(500).json({ success: false, error: 'Failed to fetch the thread' });
    
   }
  }

  export async function addCommentToThread(
   threadId: string,
   commentText: string,
   userId: string,
   path: string,
   res: NextApiResponse // Import and pass the response object
 ) {
   try {
     connectToDB();
     
     const originalThread = await Thread.findById(threadId);
 
     if (!originalThread) {
       return res.status(404).json({ message: 'Thread not found' });
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
 
     // Return a success response
     return res.status(200).json({ success: true, message: 'Comment added successfully' });
   } catch (error: any) {
     console.log(`Failed to add comment: ${error.message}`);
     
     // Return an error response
     return res.status(500).json({ success: false, error: 'Failed to add comment' });
   }
 }
 
export async function fetchUserPosts(userId:string ,res:NextApiResponse) {
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


      return res.status(200).json({ success: true, threads});

    }catch(error: any) {
         console.log(`Failed to fetch the user: ${error.message}`)
         return res.status(500).json({ success: false, error: 'Failed to fetch the user posts' });
    }
}
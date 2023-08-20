 "use server"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"
import User from "../models/user.model"
import { revalidatePath } from "next/cache"


interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export  async function createThread({text,author,communityId,path} : Params) {
   try{
    connectToDB()
    const createdThread = await Thread.create({
       text,
       author,
       community: null
    })

    //update user model
    await User.findByIdAndUpdate(author, {
        $push: {threads: createdThread._id}
    })
    revalidatePath(path)

   }catch(error : any) {
     throw new Error(`Error creating thread: ${error.message}`)
   }
}
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
   try {
     connectToDB();
 
     const skipAmount = (pageNumber - 1) * pageSize;
 
     const [posts, totalPostsCount] = await Promise.all([
       Thread.find({ parentId: { $in: [null, undefined] } })
         .sort({ createdAt: 'desc' })
         .skip(skipAmount)
         .limit(pageSize)
         .populate({
           path: 'author',
           model: User,
         })
         .populate({
           path: 'children',
           populate: {
             path: 'author',
             model: User,
             select: '_id name parentId Image',
           },
         }),
       Thread.countDocuments({ parentId: { $in: [null, undefined] } }),
     ]);
 
     const isNext = totalPostsCount > skipAmount + posts.length;
 
     return { posts, isNext };
   } catch (error:any) {
     throw new Error(`Error fetching posts: ${error.message}`);
   }
 }
 

  export async function fetchThreadById(id: string) {
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
      return thread;
   }catch(error : any) {
      throw new Error(`Error fetching thread: ${error}`)
   }
  }

  export async function addCommentToThread(
   threadId: string,
   commentText:string,
   userId:string,
   path:string
  ) {
   connectToDB()
     
      try{
          
         //finding original thread

         const originalThread  = await Thread.findById(threadId)

         if(!originalThread){
            throw new Error("Thread no found")
         }
         const commentThread = new Thread({
            text:commentText,
            author:userId,
            parentId:threadId
         })
         const savedCommentThread = await commentThread.save()
         originalThread.children.push(savedCommentThread._id);

         await originalThread.save()
         revalidatePath(path)

      }catch(error : any) {
         console.log(`Failed to add comment: ${error.message}`)
      }
  }

export async function fetchUserPosts(userId:string) {
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

      return threads

    }catch(error: any) {
         throw new Error(`Failed to fetch the user: ${error.message}`)
    }
}
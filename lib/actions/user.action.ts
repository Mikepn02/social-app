"use server"
import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import exp from "constants";
import { error } from "console";
import { get } from "http";
import Thread from "../models/thread.model";

interface Params {
    userId: string,
    username:string,
    name:string,
    bio:string,
    image:string,
    path: string
}

export async function updateUser({
    userId,
    bio,
    name,
    path,
    username,
    image,
  }: Params): Promise<void> {
    try {
      connectToDB();
  
      await User.findOneAndUpdate(
        { id: userId },
        {
          username: username.toLowerCase(),
          name,
          bio,
          image,
          onboarded: true,
        },
        { upsert: true }
      );
  
      if (path === "/profile/edit") {
        revalidatePath(path);
      }
    } catch (error: any) {
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
  }

export async function fetchUser(userId : string){
    try{
        connectToDB()

       return await User
       .findOne({id: userId})
    //    .populate({
    //     path:'comminites',
    //     model:'Community'
    //    })
    }catch(err: any){
        throw new Error(`Failed to get the user: ${err.message}`)
    }
}


export async function fetchUsers({
  userId,
  searchString="",
  pageNumber =1,
  pageSize=20,
  sortBy="desc"
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try{
    connectToDB();

    const skipAmmount = (pageNumber -1)  * pageSize
    const regex = new RegExp(searchString, "i")

    const query : FilterQuery<typeof User> = {
      id : {$ne: userId},

    }
    if(searchString.trim() !== ''){
       query.$or = [
        {username: {$regex: regex}},
        {name: {$regex: regex}}
       ]
    }
    const sortOptions = {createdAt: sortBy};
    const usersQuery = User.find(query)
    .sort(sortOptions)
    .skip(skipAmmount)
    .limit(pageSize)


    const totalUsersCount = await  User.countDocuments(query)
    const users = await usersQuery.exec()
    const isNext = totalUsersCount > skipAmmount + users.length
    return {users,isNext}

  }catch(error: any) {
    throw new Error(`Failed to fetch the users: ${error.message}`)
  }
}

export async function getActivity(userId: string){
  try{
    const userThreads = await Thread.find({author: userId})
    // Extracts child thread IDs from an array of user threads
    
    
    const childThreadIds = userThreads.reduce((acc, userThreads) => {
      return acc.concat(userThreads.children)
    },[])
    // Example after conc output: ['child1', 'child2', 'child3']

    const replies = await Thread.find({
      _id: {$in: childThreadIds},
      author:{$ne: userId}
    }).populate({
      path: 'author',
      model:'User',
      select:'name image _id'
    })

    return replies


  }catch(error: any) {
    throw new Error(`Failed to fetch activity: ${error.message}`)
  }
}
"use server"
import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import exp from "constants";
import { error } from "console";
import { get } from "http";
import Thread from "../models/thread.model";
import { NextApiResponse } from "next";

interface Params {
    userId: string,
    username:string,
    name:string,
    bio:string,
    image:string,
    path: string,
    res:NextApiResponse
}

export async function updateUser({
    userId,
    bio,
    name,
    path,
    username,
    image,
    res
  }: Params): Promise<void> {
    try {
      connectToDB();
  
      const user = await User.findOneAndUpdate(
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
        return res.status(201).json({ success: true, user });
      }
    } catch (error: any) {
      console.log(`Failed to create/update user: ${error.message}`);
      return res.status(404).json({message:error.message})
    }
  }

  export async function fetchUser(userId: string, res: NextApiResponse) {
    try {
      connectToDB();
  
      const user = await User.findOne({ id: userId });
      // You might want to check if the user exists before proceeding
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return a successful response with the fetched user data
      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      console.log(`Failed to get the user: ${err.message}`);
      
      // Return an error response
      return res.status(500).json({ success: false, error: 'Failed to fetch the user' });
    }
  }

export async function fetchUsers({
  userId,
  searchString="",
  pageNumber =1,
  pageSize=20,
  sortBy="desc",
  res
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
  res:NextApiResponse
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

    return res.status(200).json({ success: true, users,isNext });

  }catch(error: any) {
    console.log(`Failed to fetch the users: ${error.message}`)
    return res.status(500).json({ success: false, error: 'Failed to fetch the user' });
  }
}

export async function getActivity(userId: string,res:NextApiResponse){
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


    return res.status(200).json({ success: true, replies });


  }catch(error: any) {
    console.log(`Failed to fetch activity: ${error.message}`)
    return res.status(500).json({ success: false, error: 'Failed to getActivity' });
  }
}
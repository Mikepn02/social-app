"use server"
import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import exp from "constants";
import { error } from "console";
import { get } from "http";
import Thread from "../models/thread.model";
import { NextApiResponse } from "next"

interface Params {
    userId: string,
    username:string,
    name:string,
    bio:string,
    image:string,
    path: string
}

export async function updateUser(
  {
    userId,
    bio,
    name,
    path,
    username,
    image,
  }: Params,
  res: NextApiResponse
): Promise<void> {
  try {
    connectToDB();

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true, new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (path === '/profile/edit') {
      revalidatePath(path);
    }

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    console.error(`Failed to create/update user: ${error.message}`);
    res.status(500).json({ error: `Failed to create/update user: ${error.message}` });
  }
}

export async function fetchUser(userId: string, res: NextApiResponse): Promise<void> {
  try {
    connectToDB();

    const user = await User.findOne({ id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    console.error(`Failed to get the user: ${error.message}`);
    res.status(500).json({ error: `Failed to get the user: ${error.message}` });
  }
}


export async function fetchUsers(
  {
    userId,
    searchString = '',
    pageNumber = 1,
    pageSize = 20,
    sortBy = 'desc'
  }: {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
  },
  res: NextApiResponse
): Promise<void> {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, 'i');

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }
    };

    if (searchString.trim() !== '') {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } }
      ];
    }

    const sortOptions = { createdAt: sortBy };
    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(query);
    const users = await usersQuery.exec();
    const isNext = totalUsersCount > skipAmount + users.length;

    res.status(200).json({ users, isNext });
  } catch (error: any) {
    console.error(`Failed to fetch the users: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch the users: ${error.message}` });
  }
}

export async function getActivity(userId: string , res:NextApiResponse){
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

    // return replies
    res.status(200).json(replies)


  }catch(error: any) {
    console.log(`Failed to fetch activity: ${error.message}`)
    res.status(500).json("Failed to fetch the activity")
  }
}
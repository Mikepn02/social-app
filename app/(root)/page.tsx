import { UserButton } from "@clerk/nextjs";
import { fetchPosts } from "@/lib/actions/thread.action";

export default async function Home() {
        const result = await fetchPosts(1,30);
        console.log(result)
  return (
    <>
      <h1 className="head-text text-left">
         Home
      </h1>
    </>
  )
}
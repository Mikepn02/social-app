import { fetchUser } from "@/lib/actions/user.action"
import { currentUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import ProfileHeader from "@/components/shared/ProfileHeader"

const Page = async({params} : {params: {id: string}}) => {


    const user = await currentUser()
    if(!user) return null
    const userInfo = await fetchUser(params.id)
    if(!userInfo.onboarded) redirect('/onboarding')
    return (
        <section>
            <ProfileHeader 
            accountId={userInfo.id}
            authUserId={user.id}
            name={userInfo.name}
            username={userInfo.username}
            imgUrl={userInfo.imgUrl}
            bio={userInfo.bio}
            />
        </section>
    )
}
export default Page
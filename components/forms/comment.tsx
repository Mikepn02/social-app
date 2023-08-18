"use client"
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CommentValidation } from '@/lib/validations/thread'
import { Input } from '@/components/ui/input'
import * as z from 'zod';
import Image from 'next/image'
import { ChangeEvent, useState } from 'react'
import { isBase64Image } from '@/lib/utils'
import { useUploadThing } from '@/lib/uploadthing'
import { updateUser } from '@/lib/actions/user.action'
import { usePathname, useRouter } from 'next/navigation'
import { addCommentToThread, createThread } from '@/lib/actions/thread.action'

interface Props {
    threadId: string,
    currentUserImg: string,
    currentUserId: string
}


const Comment = ({ threadId, currentUserImg, currentUserId }: Props) => {
    const pathname = usePathname()
    const router = useRouter()
    const form = useForm({
        resolver: zodResolver(CommentValidation),
        defaultValues: {
            thread: ''

        }
    })
    const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
           await addCommentToThread(threadId , values.thread , JSON.parse(currentUserId),pathname)
           
           form.reset()
        }

        return (
            <Form {...form}>
                <div className='head-text'>hello</div>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="comment-form"
                >
                    <FormField
                        control={form.control}
                        name="thread"
                        render={({ field }) => (
                            <FormItem className='flex w-full  items-center gap-3 '>
                                <FormLabel>
                                    <Image 
                                    src={currentUserImg}
                                    alt='Profile image'
                                    width={48}
                                    height={48}
                                    className='rounded-full object-cover'
                                    />
                                </FormLabel>
                                <FormControl className='border-none bg-transparent'>
                                    <Input
                                        type='text'
                                        placeholder='Comment...'
                                        className='no-focus text-light-1 outline-none'
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type='submit' className='comment-form_btn'>
                        Replies
                    </Button>
                </form>
            </Form>
        )
    }

export default Comment
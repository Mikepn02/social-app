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
import { ThreadValidation } from '@/lib/validations/thread'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import * as z from 'zod';
import Image from 'next/image'
import { ChangeEvent, useState } from 'react'
import { isBase64Image } from '@/lib/utils'
import { useUploadThing } from '@/lib/uploadthing'
import { updateUser } from '@/lib/actions/user.action'
import { usePathname, useRouter } from 'next/navigation'
import { createThread } from '@/lib/actions/thread.action'


function PostThread({ userId }: { userId: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const form = useForm({
        resolver: zodResolver(ThreadValidation),
        defaultValues: {
            thread: '',
            accountId: userId,

        }
    })
    const onSubmit = async(values: z.infer<typeof ThreadValidation>) => {
       await createThread({
         text: values.thread,
         author: userId,
         communityId: null,
         path: pathname
       })
       router.push("/")
    }
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col justify-start gap-10 mt-10 "
            >
                 <FormField
                        control={form.control}
                        name="thread"
                        render={({ field }) => (
                            <FormItem className='flex w-full flex-col gap-3 '>
                                <FormLabel className='text-base-semibold text-light-2'>
                                    Content
                                </FormLabel>
                                <FormControl className='no-focus border border-dark-4 bg-dark-4 text-light-1'>
                                    <Textarea
                                        rows={15}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type='submit' className='bg-primary-500'>
                         Post Thread
                    </Button>
            </form>
        </Form>
    )
}

export default PostThread
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SetButton(){
    return(
        <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="
                hover:bg-slate-200
                dark:hover:bg-slate-800
                flex justify-center
                items-center rounded-full size-8
              "
            >
              <Image
                src="/settingBlacks.svg"
                width={24}
                height={24}
                alt="settings"
                className="block dark:hidden"
              />

              <Image
              src="/settingWhites.svg"
              width={24}
              height={24}
              alt="settings"
              className="hidden dark:block"
              />
            </Button>
          </Link>
    )
}
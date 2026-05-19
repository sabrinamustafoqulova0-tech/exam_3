"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import HomeIcon from "@mui/icons-material/Home";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

import SearchIcon from "@mui/icons-material/Search";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import ExploreIcon from "@mui/icons-material/Explore";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";

import SmartDisplayIcon from "@mui/icons-material/SmartDisplay";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";

import ChatIcon from "@mui/icons-material/Chat";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

import AddBoxIcon from "@mui/icons-material/AddBox";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div
      className="
        group
        h-screen
        flex
        flex-col
        p-3
        transition-all
        duration-300

        w-[80px]
        hover:w-[250px]
      "
    >
      {/* LOGO */}
      <div className="mb-10 px-2">
        <img
          className="h-[70px] w-[150px] hidden group-hover:block text-2xl font-bold"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACoCAMAAABt9SM9AAACFlBMVEX///8mJiYAAADIN6siIiIaGhoeHh4jIyMZGRkVFRUcHBwWFhYQEBAODg4FBQXh4eHyTVj13u9FRUXFH6X1T1LuS1/wTFv4UEzqSWj6UUj/ekTHx8fd3d2dnZ34+PiysrL9U0L/cENhYWHu7u6RkZHmR2/fQ310dHTkRnT/hEaFhYXy8vJUVFRMTEw1NTXZQIn/ZkHNzc27u7upqan/XD//dUT/jkjcQYT/uk+QNsY7OzsuLi5vb2/TPZVeXl7/nUr/qkxMX8poS8t/PcmBPMmdMsPWPpDiRHj/lkn/pkz/tU7/xFFeUstxRctmTMuqML7n3PPPO51JYspVWcu1Mbi/M7J+Q8H95OX/zFL/3VOZKMGJP7ywNa6YPLTDOJ+yOqHOJpL2z9r5QDj/US7/mnv/dDDm6ve9xuqcqd+BkdhsfdJictBuW86PSMybVc6rcdO7jdvPr+UsWMbgwOk7ZsifALk1UMZwMMWCIcSyG7SfpuBkMMOfg9e4o+DHt+bXyu1MRMa8Xsfak9HLV7mtjteObc7TfcmNVsXfn9CUHqqsSLCmH5/FhMPSYqbTXLDrwuLfk7zfcaflj7jdXo7yrr/tgJfzoq/4w8rzhpHmbpTqT2z2Zmjwp7r8z8/7gHv+oJn+trH/cVj/g2z/uqT/mGb/roH/1rz/rG3/bC7/sJb/yqL/yLb/7t3/wnL/qqLtZn3/2pr/5JXZneJ8AAATA0lEQVR4nO2bj3sTx5nHtcNqVytrZSOEjbG0NpZAIFvGkklpJCEacsTk0oTAhbiFhoAduFxzR0ICd/UlDU3SKz+aNG1+ALnEASdNLj9ok/6Hnfd9Z3Z2ZSk2wrJ5evN9Hh52V7urmc+87zvvvCNHIlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWh3p7L8+/2+/fOGFF44efeihh/7l35WeOHDgadR/oM6dO3f5xZfOP7ne7V0/ec9fePnlh4AS6KegJ57glB4nPQz6J9CDpOPHf3X8pf+nvJ4/euHCUTKpEKsDAVYPB1g9+ODBgwePX3zx7Ho3fO119pcXlmcVtCtAdRBxvbLebV9rnb0gWa0QlWR18PDhi+d/8NXl4Uquw1Z5w0NjHT7aRZ1dYlYrRnX4h2mVU8xNskZnuAqMsdRUh33qmvj015lVkS5ubPfiIjMNrjjzOmnWuGUYJrvPaD3/8tGmSXD5WKVQHX7qqadav9cruUYMabHeTtqVgmfd+wvW2f9cEtY5plf/i/SrkI5zhVA9BZpvGeS9asxg+XGzY1g1G2AN31vvVln/rWxKoHr1wGu/fv3SpUtPNunSpVfOn3/p3MWLIVRcx1q9NxU13GJk1OoYlgGwkpV7690qqylUvXr59eVyp1feuBhCdWy+RdSqO4ZVitwLrDjCGurk0W7p7G8CpA48/vSllTy08Y15hYrrzSV3DDPOKHdPsFwMd+VOHu2WXv+NjOl8/ffwayt97Mq8QnXs2FvNH3vMNpx8pENYNHkmEVbm7h7trn59QJLirH7b9KGn1Pzcu/OS1LENGzY1f1rs4f2ElLITWMPMjRoTKUo7Ctmp4cpQuSPbXHW9dkCWFJRdPXn+xcvP8Dnv6vGrpMOH5w/Pz3Nj+sUbb74rbnplXqLisJpY5hh0E44I1t2Zx4Rp2LaJrPhrnISbTDKWvcd+ror+53GB6ukTJ+jKpWeOX31G6he+RIzizK7Qfb8TpABWU4TPOzI0dwBrjBlLlbgvYF0WoE6ceJBi+0tXl4ISEm43/xYakrdpw4Y2sCw+kTE86ggWSyZdN0aUYg4ocX/ErssICnQZz9++2p7TBv5v0yY4wFuvbGoDK8NtwxrHw07cMFMeGqpU8kgrls9nQR2lW0PZVU5pLyMozucq5uGXripAzyr5VK5s3Pjmpg2bfgf3nm0HayphGD15PBxXsLxKORDaMpUmgrl8qVoPXBui2TB0T6ZYqo62XAAN16upQjjNGKuxBJtodfPUaLVUbB7AoYxoXa6i3pMJFz7OnRBOdxUvX2uidDIsjO5XNpzchInrW21gFaI8yFCfArCyjLG6KEBkqizJSsHOVZhjmrFkoPFLYRVYj2larpnhr00VAxNkb43F+dOsHsnUjMYU9Xo81jpPK0ddC24uRirR2qi0PWhdCcJsjrcsQSMdyfOLo4E3+AHqGpxt/H0LTEeU6JkjRzZgkPf9sAlWgxNyK0tg8ajv1gkEliNM3l4fDUV1pqo5FbcZ1rhLYcxkw8w2exSHDBNTZ6JRdGzLdRAgvjGJN/WWlR2VmU03J4v1qB1nJcGFJztxkx/U+UjbbBSu4VRjsYL/7DUZot7G7gcwIZ1Tp/a9884f9p3ah3pHwjr5B/j/3TawIFCJdUoAFkyR8Tr1Q7RXFWCSdCVQzCFYCfXWIl4wnZhtxI3gGtujNIN/Yli2T7iCluny4DeeAKsRN+fou6OOZUThwDYVLDjuFaMGdptN0LG/5AK/u3bt2Wd/j7bytuKEdP4oKGz85BEU9mXslLCxjW1gFWN+V8ZVUopjh6PEEynDwSSqLp4YJqOJj6qXICzZlQjNGvy1qWye6j7SdvnX4buSpWxRDEIAluG6PRZeE7nHeJxsOtsgKqaIakUBK++Q2QGgGn1Rwh/SazJCYTh6R1LaB2j+GCRwejfXn/CmfdziIMKNtYFV4e1wsq1gRQFW1gWbMg3Jjqsep14Goi7BUgGaylsQTLwJ7IQsSOSYb6Q5x/bNsSldi5HLl+GqbYC3TyFNM6UGGGCZtg+rLN6gykR+gEJYEhOA2T0TCetP/Noj770H9xw5BXi8NrAiCduwRtvB8ngbktkIUz0QtxmxeuAdCEt2RbRc5CNkZLIgATZh9NCbptBxMGaRtXIHZD14LTh4GXXcBAu+xhIv55fMcJlIhKgjp07DmcC0l+v9yBK9txdwPfIIp4WwIu1gYc0BXbZkLoHFDZ13GpDJLvJ5DmYuOx5cNWFfTRlqcIb1La9q+rE7EkFrEsEOzcm26QM+z7BMLucNA0GaDtAKpfPTcIyHYPH/rLpFgOK22SjZwTIRRigwFuwvYNoBmp4Wn3unP/jghrQxpIW4CFa7DD5Sd6noQM4ThsU7xyc9bLYjpmiym0Qo80RYwpQEErMqTuBVMisoh0wUPNQ26NjFihpxEDTR8mTnabJrBGDVIlE7MQVweUDkL04OVe1g+nGEHG/3buwvYpreuXPnduIz8+GW7Vw73z9Nd7+/VxgXGeLJk21g8ZTIREQBWEWCxQMvLPRw1nH8FV8RDCcZzDcJloz4eHuPZIs2IcwsCI4mYt5nEM9GksNywARnjI3+lAvlRfkNAMusZpjt4jfzOJXnWQiWa1UkpQDFDQr7C5i4tmy5jh/e2LIFYW3fuf1DvLBxh6SFsI4IWkthRSoTOP8EYcUQ1rjF2yDijppnKNiwQNAiWPIC4vH9Aa0pGHn8/gN0AaYQ5R0HBUzPDNonNk76JLi5mcrH+IDAd/GWVU1+7ISmnd3C86bRlLagNm/eTKw242mQ1kd7BS2CJWi1gMWNwVsKK1bkto87NghLzTOuHYdB76n5eTnC8nMLnNH9uhg+LM7QP/1JE8xX0GDCy3vVN3nBkEXJs5yQC/zr7dSEzd8Kawcny+/lxz0hWAhqWvrdZlL/TTiZ6SdYwrpuwLXTO3YgLgmLaLWE5Q9eEFZ+KmHjZFUOwconYoVCEjMgeYlghXIL334CsLD/vrcGYPHnsfxI6yby07AzI6xoABaU0VLUtJ58OQlDEIa1A0Bxv9uMsPr6UX0LcHKzH8ApXHj/tKCFsPYJWncBq2RSY7ELMq8cY3bSixQpYZLrsp4gLNxSc+VbA7ByofguQg8ccS8qKuq0jiqHAyXAko8WKNODD+Ht0WK2Bwwz7IY7t5Pj9SGsdB8qDUPopfv7ydAI1xbk89EOokWwkNZdwDJLljgLBaFCDGN7lmhRZzB9luOOyYJMCWTMyvnc/FkV+4ypEw/vZFi4JjVohY4jpAIljEATLAAD/K163QJrDAf4/4UIxY0pjbAGOKh0X7oPjhfSaGcKFwb969NES8HitNrDqoZhGaZMnYYDsPhCmMKMoJWREJTJwI6rTAnEUiYIK2QsCKtkOkETjSlYKlBWl8KC5B882y5VbfD6WggWkuLGNECw0qiP4fgGmlkAF4b4T3YSLQGLHLE9LFyZULcwrfTbOhWAVbLk1F9A34MIRAsgHxZYh4KFc2dLWNA5gFXhOYCIcJhBGQFYavVuNMOi2deh8AWjCp4RgIWo+tIEazY9AEJYt4Ec8SJaEtY0xC1K+AWtu4ElnCOQHlZYzK+CxEU6nmG4AJJuSLUAR96FWRnZazhmY7gHWIbtVzRkPSEic1/5AYa7UIAX1Cdsf6AgMREjOZaLACowplmCNUCC44VBtDKFi9xwO9ESqyNyxLuAJRcwAVhxM+mvc7Iiok64WFaWeRZeVrMhOXfG77E/D5QFrHzCSoVe6Sjm4dRWJhK080YzDq1U0QWAoVgblqwIoUoPCFiDqFkcJSAncIEz9mPu8OF2oOXDIlp3AUt6DMLCthWdQOZOobu3nqhFpJGAqBYg8yxRZ6ABTwRuo/hklnIssFdJsyHtsbDAAFCDxHInJ8pY+E6MrjQY8EIyRY/ZEWAFtqRgjXBYePLp4EAQF0b9CCQRYFsIa7egdWoZWJ6CJQMAdgGaUWYqpRYhyKonWEU8SmTdaCDciXRf5B2JoM3hL2/M0riZVFtnwXQ/NE9QMTElvsFQwyGWE2OimRTW+PQaQVSDks/sCGr2FpzMADofV/o2XDu9WdAiWLvvGpbMlTDWcvfJJWzoSFkYF9VHLVgBqzpDjrlYtJS5p2Xbfr4wFCzXiOK0acbHVRM8FajG1GyLfNRwUIlMpmOq/A+DR4NZdEcjaUQlYc2NCOEbbqNXClyf4qWbmKDyJaSARbTaw8KhptowWb3MtSk16MlbJhT0yixZwy6UVKMxP8ACWDU+ESpfOCYELYp+4xZ8IKoTorRp2G5wUwZ/Qog3U+ijmD7m2rGSnOsqos5Hw0qFHlqOOzJ3iPHlfxpYcTpzBGsPae420ZobEbhmiRWtgIAWwtorylvtYVlq5YaRwN9ZFoXMmB1P0W0mK5bLjR5qMxoK1uWT2WHD4ucVCmEeJmMs54gAM8wsxAhu543HBazwng7aGyyjepMW/RKRH+cmzEQR7BjQ5RJmLQCL8JJ/wvoJhiLvcGRpRNUMa88cDc3M4tzs7Mjs7ADBi3xHGRf3RIK1l0yrPaykmnDCtRRp+CZU/GhgY8kkTkO2WB9m0RscvpiEF6TgM8up11zoLNbdE8UCc4q9ojhfBxRD4MbNv60s4cKyUHSjDSoVs9IoM+NV8lB3NB+zJrIY1MVWXC9zLIciKc22tVQC4A2Q2+2ZWxCwJrk4rUXxRTO3b926vSBOrvf1UzYvYO0QtNrDYsqaAms0ZIdRNB6HC2W5l4Wu6e+mpGgLP4bNzhFJyzZhPeThNkQsbvFoPYUATIuf5sC7VfIqNIYVjXjMSubEApTfnJgYo5KuYfXYrIzlVH8zKVds1MWw4i22icOMsMCUEMikrz2fLe357QHMuHChOLMiWGOBmchjUdNU+4BezDEtViILHqqxRNzkWXPcZQU/3nglFod7yDdyVdhJjbIaFYhrybgZZxM57E/CMi2H1T2MSktgRcZK/Lst18D9LW41ppUQe5ZTcBbl+IdYjL/catEHvCWGOe4AopKwtnFM2wSuxebfZN2aTfdJWgjL2yFotYWlJhM4qadSefVZrpAaVYXkTLaeMmqpwnBov7xSTzXU7xUqhVSp4D8yXC/VxWdj2Uaqke+NCLtxIks0VCg1hHPm8o3UaFZaeC4/nirAaJYLpVSj5U8q/Fsig4hqcnLuWzhb3KY0Oflt8JGF9OAApBD9FLZwK2x6OVjgemztfkNbp73Cnm69f3EPhanJz+HsuQekANdX2z4XWxXejY95GkGLRaIFV2empWm1g8XTheh4m89WXw0Xt7GM5PK3dqZFYrVt29dw9vkDW4WI1+Tc5GfPPffZnjmegA0KWuiI38Hdp5eFZdlxu6M/r+hEJcdIFLoLi1Bte2ArnM2c2bp1VxOvSXTUEaA1QI7YLxbVWK5BWm1glRlLrdUfK3nVqJEYpdJmt75jkVA9sPUrtIBdvgQvoDXZTEvUVT9aDlamtGZ/IDFWixs9DVoqdhEWotq69QyG8y/P7Arxak2rDzc0PKo/cFpt3XDN5E1YBq4Fkl2FJVjt2vVnPP/iR0JLcREtNC20wk/4qkeY1rrDSsX5qhhalWydOqyOFrcRql27ztzBC1/86NChQ4qXpBUwrYE+ikNbtvum1fwbkrVW3RGrbFjAmC1/G7ka+kyw4mwO0ZUvD5Fa0hoZnKX6DV/73D+wYG1JZWTcmWl063ue81EdOvSFuHbnm//bT7TOgL4CzaFGFm/dEDctbMbyA8Fas/SgtWJ28NdIahdxtfW1YrV//zehj+RfooyBZpr+JAWLNb5pdat1K9Nw0l+AQk2xe3+j+O0ZYIWo9jfT+gHd6NtMsNC0WvyWay1Vj/v7IFBR7d4fGMycIbvipB599NGf/OTOSh7ybqZF9YH88L1utW5lSpn+/hbnZrcqHaySJCtExfWXL5d7YubWoFj0bAlu9ayfqqb/M0A38HPCLuhraVYc1D+T/vL9l3dI6k/oZlALt//66cjsoFhP+37YvdatSNycxI4F1O07+1PQlckTdkWofkyCQw7v0f37YVIUU6KYEEcojVd+OP1B91q3Ig0zubE8YcIfZndR3/isCNRjj0lenBbhgnRLJFt+Gt/f7wetbrZuReJrHag1Z3ge75SWv/1ehKzIqh6TIlxIC2wLc1OZmQ76VcDARs+6aqyWsB3GmGmzriWkQnf2C7tCTD8DES6k1cq0uB/6sLZ/0uXmrUj5JEskEszufpXjjs/qZ1I+LXTEoGkpP6Ri/PWuN29lKk9lp9bkT/XvNLMSuIKmtcQPKWitd3BfD33/Y0L1cxLRkqYlopbvhypofbfe5Yb1kfe9QiVwIS0yrTAsSh7SfTcXln/vP6rufP+3vzXTAtNqClpgWumPb15fWOdSg5aWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaW1n2tvwM7mYjfx6tTywAAAABJRU5ErkJggg=="
          alt=""
        />
        <div className="h-[40px] mt-[20px] group-hover:hidden text-2xl font-bold">
          <img
            className="h-[30px]  group-hover:hidden text-2xl font-bold"
            src="data:image/jpeg;base64,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"
            alt=""
          />
        </div>
      </div>

      {/* MENU */}
      <div className="flex flex-col gap-2">
        <Link
          href="/home"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/home" ? <HomeIcon /> : <HomeOutlinedIcon />}

            <span className="hidden group-hover:block">Home</span>
          </button>
        </Link>

        <Link
          href="/reels"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/reels" ? (
              <SmartDisplayIcon />
            ) : (
              <SmartDisplayOutlinedIcon />
            )}

            <span className="hidden group-hover:block">Reels</span>
          </button>
        </Link>
        <Link
          href="/messeges"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/messeges" ? <ChatIcon /> : <ChatOutlinedIcon />}

            <span className="hidden group-hover:block">Messages</span>
          </button>
        </Link>

        <Link
          href="/search"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/search" ? <SearchIcon /> : <SearchOutlinedIcon />}

            <span className="hidden group-hover:block">Search</span>
          </button>
        </Link>

        <Link
          href="/expore"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/expore" ? <ExploreIcon /> : <ExploreOutlinedIcon />}

            <span className="hidden group-hover:block">Explore</span>
          </button>
        </Link>
        <Link
          href="/notifications"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/notifications" ? (
              <FavoriteIcon />
            ) : (
              <FavoriteBorderIcon />
            )}

            <span className="hidden group-hover:block">Notifications</span>
          </button>
        </Link>

        <Link
          href="/create"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/create" ? <AddBoxIcon /> : <AddBoxOutlinedIcon />}
            <span className="hidden group-hover:block">Create</span>
          </button>
        </Link>
        <Link
          href="/profile"
          className="flex items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="Profile"
              className="w-[25px] h-[25px] rounded-[50%]"
            />

            <span className="hidden group-hover:block">Profile</span>
          </button>
        </Link>
        <Link
          href="/create"
          className="flex mt-[50px] items-center  hover:bg-gray-100  rounded-xl"
        >
          <button className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-xl">
            {pathname === "/more" ? <MenuIcon /> : <MenuOutlinedIcon />}
            <span className="hidden group-hover:block">More</span>
          </button>
        </Link>
      </div>
    </div>
  );
}

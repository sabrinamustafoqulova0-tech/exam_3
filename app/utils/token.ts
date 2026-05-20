import axios from "axios"

export function SaveToken (token:string){
    localStorage.setItem("store_token",token)
}



export const Api = process.env.NEXT_PUBLIC_API

export const MyAxios= axios.create({
    baseURL:Api
})

export function GetToken(){
    return localStorage.getItem("store_token")
}



MyAxios.interceptors.request.use(
    (config)=>{
        const token=GetToken()
        console.log(token, "kk");
        if(token){
            config.headers["Authorization"]= `Bearer ${token}`
        }
        return config
    },
    (error)=>Promise.reject(error)
)
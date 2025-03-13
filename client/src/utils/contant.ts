import type { MyInfo } from "../type/myinfo";


const defaultMyInfo: MyInfo = {
  id: "",
  username: "",
  createAt: 0

}



export const DiscoveredList: Set<string> = new Set()


// 每次更改时打印 log

export const MYINFO: MyInfo = new Proxy(defaultMyInfo, {
  set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)
    // console.log(`Updated my info: Set ${key.toString()} to ${value.toString()}`)
    return res
  },
})




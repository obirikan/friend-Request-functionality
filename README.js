//link

const router=require('express').Router()
const users=require('../models/users')
const auth=require('../middleware/auth') //middleware(jwt)



//USER MODEL
const UsersSchema=new mongoose.Schema({
    sendRequest:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }],
     Request:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }],
    friendlist:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }],
},
{timestamps:true})

module.exports=mongoose.model('users',UsersSchema)



#code
//SEND FRIEND REQUEST 
router.put('/connect/:id',auth,async(req,res)=>{
    const {id}=req.params
    const {id:userId}=req.decoded
    try{
    //person sending request to
     const recipient=await users.findById(id)
    //person sending the request
     const requester=await users.findById(userId)
    //send friend request to store in recipients request
    

    //validating for user to be add friend once
    if(recipient.sendRequest.filter(pins=>pins.toString()===userId).length>0){
        return res.status(400).json({msg:'user has already sent  you a request'})
    }
    else{
        if(recipient.Request.filter(pins=>pins.toString()===userId).length>0){
            return res.status(400).json({msg:'pending'})
        }else{
            if(recipient.friendlist.filter(pins=>pins.toString()===userId).length>0){
                return res.status(400).json({msg:'friends'})
            }else{
                const recep=await users.findByIdAndUpdate(recipient._id,{
                    $push:{
                        Request:requester._id,
                   }
                },{new:true})
            }
        }
   }

    //keeping track of sent request
    if(requester.sendRequest.filter(pins=>pins.toString()===recipient._id).length>0){
        return res.status(400).json({msg:'already on sent request list'})
    }else{
        const requ=await users.findByIdAndUpdate(requester._id,{
            $push:{sendRequest:recipient._id}
        },{new:true})
         res.json(recipient)
    }
  
    }catch(error){
 
    }
})

//UNSEND FREIND REQUEST 
router.put('/unconnect/:id',auth,async(req,res)=>{
    const {id}=req.params
    const {id:userId}=req.decoded
    try{
    //person sending request to
     const recipient=await users.findById(id)
    //person sending the request
     const requester=await users.findById(userId)
    //send friend request to store in recipients request
    

    //checkin if user is in list to remove
    if(recipient.Request.filter(pins=>pins.toString()===userId).length>0){
        const recep=await users.findByIdAndUpdate(recipient._id,{
            $pull:{Request:
                requester._id,
            }
        },{new:true})
    }else{
        res.send('user is not on list')
    }

    //REMOVE RECIPIENT from list
    if(requester.sendRequest.filter(pins=>pins.toString()!==recipient._id).length>0){
        const requ=await users.findByIdAndUpdate(requester._id,{
            $pull:{sendRequest:recipient._id}
        },{new:true})
        res.json(recipient)
    }else{
        res.send('cant')
    }
 
    }catch(error){
     res.json(error)
    }
})

 // ACCEPT FRIEND REQUEST FROM OTHER USER
router.put('/acceptRequest/:id',auth,async(req,res)=>{
    const {id}=req.params
    const {id:userId}=req.decoded
    try{
    //person sending request to
     const recipient=await users.findById(id)
    //person sending the request
     const requester=await users.findById(userId)
    //send friend request to store in recipients request
    

    // checkin if user is in list 
    if(requester.Request.filter(pins=>pins.toString()!==recipient._id).length>0){
        const recep=await users.findByIdAndUpdate(requester._id,{
            $pull:{
                Request:recipient._id,
            },
            $push:{
                friendlist:recipient._id,
            }
        },{new:true})
    }else{
        res.send('not on list')
    }

    //removing user from sent request and adding him/her to friendlist
    if(recipient.sendRequest.filter(pins=>pins.toString()!==requester._id).length>0){
        const recep=await users.findByIdAndUpdate(recipient._id,{
            $pull:{
                sendRequest:requester._id,
            },
            $push:{
                friendlist:requester._id,
            }
        },{new:true})
        res.json(requester)
    }else{
        res.send('not on list')
    }
    }catch(error){
     res.json(error)
    }
})

//REMOVING USER FROM FRIENDLIST
router.put('/unfriend/:id',auth,async (req,res)=>{
         const {id}=req.params
         const {id:userId}=req.decoded
    try{
        //person sending request to
         const recipient=await users.findById(id)
        //person sending the request
         const requester=await users.findById(userId)
        //send friend request to store in recipients request

        if(requester.friendlist.filter(pins=>pins.toString()!==recipient._id).length>0){
            //removing id of user from friendlist 
               const requ=await users.findByIdAndUpdate(requester._id,{
                $pull:{friendlist:recipient._id}
            },{new:true})
            //removing my id from the other users friendlist
            await users.findByIdAndUpdate(recipient._id,{
                $pull:{friendlist:requester._id}
            },{new:true})
            res.json(requ)
        }else{
            res.send('user is not on list')
        }

    } catch (error) {
        res.status(500).json(error)
    }
})

//view friends
router.get('/friends',auth,async (req,res)=>{
    const {id:userId}=req.decoded
    try {
        const friends=await users.findById(userId).populate('friendlist',['username','pic'])

        res.json(friends.friendlist)
    } catch (error) {
        res.status(500).json(error)
    }
})
 
//view friends requests
router.get('/friendRequests',auth,async (req,res)=>{
    const {id:userId}=req.decoded
    try {
        const friends=await users.findById(userId).populate('Request',['username','pic'])

        res.json(friends.Request)
    } catch (error) {
        res.status(500).json(error)
    }
})

import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';
import { askDocs as askDocsService } from './ai.service.js';

export const askDocs = asyncHandler(async (req,res)=>{
   const{question}=req.body as {question:string} ;
   const answer =await askDocsService(question)
   return success(res,200,'answer generated',answer)
})
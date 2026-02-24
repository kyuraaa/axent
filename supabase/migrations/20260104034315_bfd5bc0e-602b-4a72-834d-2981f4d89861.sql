-- Fix chat_messages - add explicit UPDATE policy to prevent message modification
CREATE POLICY "Users cannot update chat messages" 
ON public.chat_messages 
FOR UPDATE 
USING (false);
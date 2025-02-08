async def process_one(self) -> bool:
        """Process one email from the queue."""
        try:
            result = await self.queue.dequeue()
            if result is None:
                return False
            
            email_id, email = result
            
            # Create email content
            email_content = EmailContent(
                to=email.email_to,
                subject=email.subject,
                template_name=email.template_name,
                template_data=email.template_data,
            )

            # Send email
            async with AsyncSessionLocal() as db:
                await send_email(
                    db=db,
                    email_id=email_id,
                    email_content=email_content,
                )
                
            return True

        except Exception as e:
            logger.error(f"Error processing email queue: {e}")
            return False 
import os
import openai

# It's recommended to set your OpenAI API key as an environment variable
# For example, export OPENAI_API_KEY='your_key_here'
# Or, you can set it directly in the code (less secure for shared scripts):
# openai.api_key = "YOUR_OPENAI_API_KEY"

class OpenAITextClient:
    """
    A client for interacting with the OpenAI API for text generation tasks.
    """
    def __init__(self, api_key: str = None, model: str = "gpt-3.5-turbo"):
        """
        Initializes the OpenAI client.

        Args:
            api_key (str, optional): The OpenAI API key. If None, it tries to
                                     read from the OPENAI_API_KEY environment variable.
            model (str, optional): The OpenAI model to use for generation.
                                   Defaults to "gpt-3.5-turbo".
        """
        if api_key:
            openai.api_key = api_key
        elif os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.getenv("OPENAI_API_KEY")
        else:
            raise ValueError("OpenAI API key not provided. Set it as an environment variable OPENAI_API_KEY or pass it to the constructor.")

        self.model = model

    def summarize_text(self, text: str, focus: str = None, target_language: str = None) -> str:
        """
        Summarizes the given text.

        Args:
            text (str): The text to summarize.
            focus (str, optional): Specific aspects to focus on in the summary.
            target_language (str, optional): If provided, translates the summary's key points
                                             to this language (e.g., "Spanish").

        Returns:
            str: The summarized text, potentially with translated key points.
        """
        prompt = f"Summarize the following text:\n\n{text}\n\n"
        if focus:
            prompt += f"Focus on: {focus}.\n"

        if target_language:
            prompt += f"Translate the key points of the summary into {target_language}."

        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes text and translates key points if requested."},
                    {"role": "user", "content": prompt}
                ]
            )
            summary = response.choices[0].message.content.strip()
            return summary
        except Exception as e:
            return f"Error during summarization: {e}"

    def generate_email(self, recipient_profile: str, goal: str, key_benefits: list[str], tone: str, language: str = "Spanish") -> str:
        """
        Generates a professional and persuasive email.

        Args:
            recipient_profile (str): Description of the email recipient (e.g., "Argentinian restaurant owner").
            goal (str): The objective of the email (e.g., "convince them to switch to our bioplastic containers in July").
            key_benefits (list[str]): A list of key benefits to highlight.
            tone (str): The desired tone of the email (e.g., "encouraging and practical").
            language (str, optional): The language of the email. Defaults to "Spanish".

        Returns:
            str: The generated email content.
        """
        benefits_str = "- " + "\n- ".join(key_benefits)
        prompt = (
            f"Write a professional and persuasive email in {language} for an {recipient_profile}. "
            f"The goal is to {goal}. "
            f"Highlight these key benefits:\n{benefits_str}\n"
            f"Keep the tone {tone}."
        )

        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You are a helpful assistant that writes professional emails in {language}."},
                    {"role": "user", "content": prompt}
                ]
            )
            email_content = response.choices[0].message.content.strip()
            return email_content
        except Exception as e:
            return f"Error during email generation: {e}"

    def generate_social_media_post(self, platform: str, topic: str, language: str = "Spanish", image_description: str = None) -> str:
        """
        Generates a social media post.

        Args:
            platform (str): The social media platform (e.g., "LinkedIn", "Instagram").
            topic (str): The topic of the post.
            language (str, optional): The language of the post. Defaults to "Spanish".
            image_description (str, optional): If an image is intended, describe it to tailor the text.

        Returns:
            str: The generated social media post.
        """
        prompt = f"Create a compelling {platform} post in {language} about: {topic}.\n"
        if image_description:
            prompt += f"The post will accompany an image described as: {image_description}.\n"
        prompt += "Make it engaging and appropriate for the platform."

        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You are a social media content creation assistant for {platform} in {language}."},
                    {"role": "user", "content": prompt}
                ]
            )
            post_content = response.choices[0].message.content.strip()
            return post_content
        except Exception as e:
            return f"Error during social media post generation: {e}"

    def generate_script_for_video(self, topic: str, duration_minutes: float, tone: str, language: str = "Argentinian Spanish") -> str:
        """
        Generates a script for a short video.

        Args:
            topic (str): The topic of the video.
            duration_minutes (float): The desired duration of the video in minutes.
            tone (str): The tone of the video script (e.g., "upbeat", "informative").
            language (str, optional): The language of the script. Defaults to "Argentinian Spanish".

        Returns:
            str: The generated video script.
        """
        prompt = (
            f"Write a script for a short, {tone} video, approximately {duration_minutes} minute(s) long, "
            f"explaining {topic}. The target audience is Argentinian businesses. "
            f"The language should be {language}."
        )
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a creative scriptwriter for short informational videos."},
                    {"role": "user", "content": prompt}
                ]
            )
            script_content = response.choices[0].message.content.strip()
            return script_content
        except Exception as e:
            return f"Error during video script generation: {e}"

# Example Usage (requires OpenAI API key to be set)
if __name__ == "__main__":
    # Ensure your OPENAI_API_KEY environment variable is set before running this.
    # For example, in your terminal: export OPENAI_API_KEY='your_actual_api_key'
    # Or pass it directly: client = OpenAITextClient(api_key="your_actual_api_key")

    try:
        client = OpenAITextClient()
        print("OpenAI Text Client initialized.\n")

        # Example 1: Summarize text
        print("--- Example: Summarize Text ---")
        long_text = (
            "Argentina's new environmental regulations (Decree 123/2023) mandate a phased reduction "
            "in single-use plastics for businesses starting Q1 2025. The regulations aim to promote "
            "sustainable alternatives and circular economy principles. Several local companies have begun "
            "investing in bioplastic production, with 'BioPlast S.A.' and 'EcoFriendly Packaging SRL' "
            "emerging as key suppliers. However, concerns about the current cost of bioplastics, "
            "which can be 15-30% higher than conventional plastics, and the scalability of local production "
            "remain significant hurdles for widespread adoption, especially among small to medium-sized enterprises (SMEs)."
        )
        summary = client.summarize_text(
            long_text,
            focus="cost and availability of bioplastics for small businesses, and regulatory impact",
            target_language="Spanish"
        )
        print(f"Summary:\n{summary}\n")

        # Example 2: Generate Email
        print("--- Example: Generate Email ---")
        email = client.generate_email(
            recipient_profile="Argentinian cafe owner",
            goal="convince them to try our new line of compostable bioplastic coffee cups and lids starting next month",
            key_benefits=[
                "enhancing their brand's eco-friendly image",
                "meeting customer demand for sustainable options",
                "preparing for upcoming plastic regulations"
            ],
            tone="friendly and informative",
            language="Spanish"
        )
        print(f"Generated Email:\n{email}\n")

        # Example 3: Generate Social Media Post
        print("--- Example: Generate Social Media Post (LinkedIn) ---")
        linkedin_post = client.generate_social_media_post(
            platform="LinkedIn",
            topic="the advantages of bioplastics for Argentinian businesses in the food service industry",
            language="Spanish",
            image_description="A split image: one side shows polluting plastic waste, the other shows vibrant, healthy plants growing from composted bioplastic items."
        )
        print(f"LinkedIn Post:\n{linkedin_post}\n")

        # Example 4: Generate Video Script
        print("--- Example: Generate Video Script ---")
        video_script = client.generate_script_for_video(
            topic="the key benefits of switching to bioplastics for small Argentinian retailers",
            duration_minutes=1,
            tone="upbeat and encouraging",
            language="Argentinian Spanish"
        )
        print(f"Video Script:\n{video_script}\n")

    except ValueError as ve:
        print(f"Configuration Error: {ve}")
        print("Please ensure your OpenAI API key is correctly set as an environment variable (OPENAI_API_KEY) or passed to the client.")
    except openai.error.AuthenticationError as ae:
        print(f"OpenAI Authentication Error: {ae}")
        print("Please check your OpenAI API key. It seems to be invalid or not properly configured.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# To make this script executable and install dependencies:
# 1. Save this code as openai_text_client.py
# 2. Install the OpenAI library: pip install openai
# 3. Set your API key: export OPENAI_API_KEY='your_openai_api_key'
# 4. Run the script: python openai_text_client.py
# Note: Actual execution of API calls will incur costs on your OpenAI account.
# The example usage is guarded by if __name__ == "__main__":
# and includes error handling for missing API key.
# Remember to replace 'your_openai_api_key' with your actual key if not using env variables.
# Using environment variables is the recommended practice.
print("Placeholder for API key instructions added. The script `openai_text_client.py` has been created with a class and example usage.")

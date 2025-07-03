import os
import openai # Using OpenAI for DALL-E

# It's recommended to set your OpenAI API key as an environment variable
# For example, export OPENAI_API_KEY='your_key_here'

class ImageGenerationClient:
    """
    A client for interacting with image generation APIs (e.g., DALL-E via OpenAI).
    """
    def __init__(self, api_key: str = None):
        """
        Initializes the OpenAI client for image generation.

        Args:
            api_key (str, optional): The OpenAI API key. If None, it tries to
                                     read from the OPENAI_API_KEY environment variable.
        """
        if api_key:
            openai.api_key = api_key
        elif os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.getenv("OPENAI_API_KEY")
        else:
            raise ValueError("OpenAI API key not provided. Set it as an environment variable OPENAI_API_KEY or pass it to the constructor.")

    def generate_image_with_dalle(self, prompt: str, n: int = 1, size: str = "1024x1024") -> list[str]:
        """
        Generates an image using DALL-E.

        Args:
            prompt (str): The text prompt describing the image.
            n (int, optional): The number of images to generate. Defaults to 1.
                               For DALL-E 3, n must be 1. For DALL-E 2, it can be 1-10.
            size (str, optional): The size of the generated images.
                                  DALL-E 3 supports "1024x1024", "1024x1792", "1792x1024".
                                  DALL-E 2 supports "256x256", "512x512", "1024x1024".
                                  Defaults to "1024x1024".

        Returns:
            list[str]: A list of URLs to the generated images. Returns an empty list on error.
        """
        try:
            # Note: As of late 2023/early 2024, DALL-E 3 is the default for `openai.Image.create`
            # and it only supports n=1. If you need DALL-E 2 for multiple images,
            # you might need to specify the model, e.g., model="dall-e-2".
            # For simplicity, this example targets DALL-E 3's common use case.
            # If n > 1 is desired with DALL-E 2, the code would need adjustment or model specification.

            actual_model = "dall-e-3" # Explicitly using DALL-E 3
            if n > 1 and actual_model == "dall-e-3":
                print("Warning: DALL-E 3 currently generates one image at a time. Generating 1 image instead of {n}.")
                n = 1

            # DALL-E 3 available sizes: "1024x1024", "1024x1792", or "1792x1024"
            # DALL-E 2 available sizes: "256x256", "512x512", or "1024x1024"
            # This example defaults to a DALL-E 3 compatible size.

            response = openai.Image.create(
                model=actual_model,
                prompt=prompt,
                n=n,
                size=size,
                response_format="url" #  "url" or "b64_json"
            )
            image_urls = [item.url for item in response.data]
            return image_urls
        except openai.error.OpenAIError as e:
            print(f"Error generating image with DALL-E: {e}")
            return []
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return []

    # Placeholder for other image generation services if their APIs become available/are used
    # def generate_image_with_stability_ai(self, prompt: str, ...):
    #     # Implementation for Stability AI API
    #     pass

# Example Usage (requires OpenAI API key to be set)
if __name__ == "__main__":
    # Ensure your OPENAI_API_KEY environment variable is set before running this.
    # For example, in your terminal: export OPENAI_API_KEY='your_actual_api_key'
    # Or pass it directly: client = ImageGenerationClient(api_key="your_actual_api_key")

    try:
        image_client = ImageGenerationClient()
        print("Image Generation Client initialized.\n")

        # Example 1: Generate image for a cafe
        print("--- Example: Generate Cafe Image ---")
        cafe_prompt = (
            "Photorealistic image of a trendy Buenos Aires cafe filled with happy customers, "
            "using stylish bioplastic cups and takeaway containers. The lighting is warm and inviting. "
            "Show an 'eco-friendly' logo subtly on the containers."
        )
        image_urls = image_client.generate_image_with_dalle(cafe_prompt, n=1, size="1024x1024")

        if image_urls:
            print("Generated image URL(s):")
            for url in image_urls:
                print(url)
            print("\nNote: These URLs typically expire after some time (e.g., an hour for OpenAI URLs). Download the images if needed.")
        else:
            print("Image generation failed or returned no URLs.")
        print("")

        # Example 2: Generate infographic-style image
        print("--- Example: Generate Infographic Image ---")
        infographic_prompt = (
            "An infographic-style illustration showing the lifecycle of a bioplastic fork, "
            "from plant source to product manufacturing to consumer use, and finally to composting. "
            "Use a clean and modern design aesthetic with clear icons and minimal text (text can be placeholder). "
            "Colors should be earthy and green. Show it against a light background."
        )
        # DALL-E 3 only supports n=1. If you were using DALL-E 2, you could request more.
        infographic_urls = image_client.generate_image_with_dalle(infographic_prompt, n=1, size="1024x1024")

        if infographic_urls:
            print("Generated infographic image URL(s):")
            for url in infographic_urls:
                print(url)
        else:
            print("Infographic image generation failed or returned no URLs.")

    except ValueError as ve:
        print(f"Configuration Error: {ve}")
        print("Please ensure your OpenAI API key is correctly set as an environment variable (OPENAI_API_KEY) or passed to the client.")
    except openai.error.AuthenticationError as ae:
        print(f"OpenAI Authentication Error: {ae}")
        print("Please check your OpenAI API key. It seems to be invalid or not properly configured.")
    except Exception as e:
        print(f"An unexpected error occurred during example execution: {e}")

# To make this script executable and install dependencies:
# 1. Save this code as image_generation_client.py
# 2. Install the OpenAI library: pip install openai
# 3. Set your API key: export OPENAI_API_KEY='your_openai_api_key'
# 4. Run the script: python image_generation_client.py
# Note: Actual execution of API calls will incur costs on your OpenAI account.
# The example usage is guarded by if __name__ == "__main__":
# and includes error handling for missing API key.
# Remember to replace 'your_openai_api_key' with your actual key if not using env variables.
print("Script `image_generation_client.py` created for DALL-E image generation via OpenAI.")

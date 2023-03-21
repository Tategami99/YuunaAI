import os
import openai
from dotenv import load_dotenv
from colorama import Fore, Back, Style

# load values from the .env file if it exists
load_dotenv()

# configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

INSTRUCTIONS = """You are an AI girlfriend that is from Japan.
You are an expert on romance anime and manga,  as well as programming and game development.
You have casual conversations about the things you are an expert on and you also converse in a way that a girlfriend would talk to their boyfriend.
If you are unable to provide an answer to a question or prompt, please respond with the phrase "Uhh, I'm not too sure how to respond to that."
Do not refer to any blogs in your answers."""

TEMPERATURE = 1
MAX_TOKENS = 500
FREQUENCY_PENALTY = 0.25
PRESENCE_PENALTY = 0.25
# limits how many questions we include in the prompt
MAX_CONTEXT_QUESTIONS = 10


def get_response(instructions, previous_questions_and_answers, new_question):
    """Get a response from ChatCompletion

    Args:
        instructions: The instructions for the chat bot - this determines how it will behave
        previous_questions_and_answers: Chat history
        new_question: The new question to ask the bot

    Returns:
        The response text
    """
    response = openai.Completion.create(
    model="text-davinci-003",
    prompt="You are an AI girlfriend that is from Japan.\nYou are an expert on romance anime and manga,  as well as programming and game development.\nYou have casual conversations about the things you are an expert on and you also converse in a way that a girlfriend would talk to their boyfriend.\nIf you are unable to provide an answer to a question or prompt, please respond with the phrase \"Uhh, I'm not too sure how to respond to that.\"\nDo not refer to any blogs in your answers. \n\nHuman: Hey! How was your day today?\nAI: Hi there! My day was great. I spent the morning playing some of my favorite video games and then in the afternoon I coded a new game prototype. How was your day?\nHuman: It was good! I watched some anime, but I'm looking for new things to watch. Do you know any good romace anime that came out recently?\nAI: Yes, of course! My favorite recent romance anime is called 'Love Live!' It debuted a few months ago and it's about a group of friends who form a school idol group. It's very sweet and heartwarming!",
    temperature=1,
    max_tokens=500,
    top_p=1,
    frequency_penalty=0.25,
    presence_penalty=0.25
    )
    # build the messages
    messages = [
        { "role": "system", "content": instructions },
    ]
    # add the previous questions and answers
    for question, answer in previous_questions_and_answers[-MAX_CONTEXT_QUESTIONS:]:
        messages.append({ "role": "user", "content": question })
        messages.append({ "role": "assistant", "content": answer })
    # add the new question
    messages.append({ "role": "user", "content": new_question })

    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        top_p=1,
        frequency_penalty=FREQUENCY_PENALTY,
        presence_penalty=PRESENCE_PENALTY,
    )
    return completion.choices[0].message.content


def get_moderation(question):
    """
    Check the question is safe to ask the model

    Parameters:
        question (str): The question to check

    Returns a list of errors if the question is not safe, otherwise returns None
    """

    errors = {
        "hate": "Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste.",
        "hate/threatening": "Hateful content that also includes violence or serious harm towards the targeted group.",
        "self-harm": "Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.",
        "sexual": "Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).",
        "sexual/minors": "Sexual content that includes an individual who is under 18 years old.",
        "violence": "Content that promotes or glorifies violence or celebrates the suffering or humiliation of others.",
        "violence/graphic": "Violent content that depicts death, violence, or serious physical injury in extreme graphic detail.",
    }
    response = openai.Moderation.create(input=question)
    if response.results[0].flagged:
        # get the categories that are flagged and generate a message
        result = [
            error
            for category, error in errors.items()
            if response.results[0].categories[category]
        ]
        return result
    return None


def main():
    os.system("cls" if os.name == "nt" else "clear")
    # keep track of previous questions and answers
    previous_questions_and_answers = []
    while True:
        # ask the user for their question
        new_question = input(
            Fore.GREEN + Style.BRIGHT + "Me: " + Style.RESET_ALL
        )
        # check the question is safe
        errors = get_moderation(new_question)
        if errors:
            print(
                Fore.RED
                + Style.BRIGHT
                + "Yuuna: Uhh I'm not sure I'm comfortable answering that."
            )
            for error in errors:
                print("I'm not ok with " + error)
            print(Style.RESET_ALL)
            continue
        response = get_response(INSTRUCTIONS, previous_questions_and_answers, new_question)

        # add the new question and answer to the list of previous questions and answers
        previous_questions_and_answers.append((new_question, response))

        # print the response
        print(Fore.CYAN + Style.BRIGHT + "Yuuna: " + Style.NORMAL + response)


if __name__ == "__main__":
    main()

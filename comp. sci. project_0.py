#  Game Console of Collection: Rock-Paper-Scissors, Tic-Tac-Toe, Sudoku (6x6)

import random
import pandas as pd
import os
from datetime import datetime

# -------------------------------------------------------
#  Ensure data folder exists for saving results
# -------------------------------------------------------
if not os.path.exists("data"):
    os.makedirs("data")

RESULTS_FILE = "data/game_results.csv"

# -------------------------------------------------------
#  Function to save game results
# -------------------------------------------------------
def save_result(name, game, result_info):
    """
    Saves or updates player's result in the CSV file.
    result_info: dictionary with fields like {'Winner/Time': 'Bot', 'Games Played': 1, 'Wins': 1}
    """
    # Add date and time for record
    date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Create new record
    new_entry = {
        "Name": name,
        "Game": game,
        "Date-Time": date_time,
        "Result": result_info.get("Result", ""),
        "Games Played": result_info.get("Games Played", 1),
        "Wins": result_info.get("Wins", 0),
        "Win %": result_info.get("Win %", ""),
        "Time Taken": result_info.get("Time", "")
    }

    # Load or create CSV
    if os.path.exists(RESULTS_FILE):
        df = pd.read_csv(RESULTS_FILE)
    else:
        df = pd.DataFrame(columns=new_entry.keys())

    # Append the new record
    df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)

    # Save back to CSV
    df.to_csv(RESULTS_FILE, index=False)
    print(f" Result saved to {RESULTS_FILE}\n")


# -------------------------------------------------------
#  Rock-Paper-Scissors (Best of 5)
# -------------------------------------------------------
def rock_paper_scissors(player_name):
    print("\n--- Rock Paper Scissors Game (Best of 5) ---")
    choices = ["rock", "paper", "scissors"]
    user_score = bot_score = 0
    round_number = 1

    while user_score < 3 and bot_score < 3:
        print(f"\nRound {round_number}: You {user_score} | Bot {bot_score}")
        user_choice = input("Enter rock, paper, or scissors: ").lower()

        if user_choice not in choices:
            print("Invalid choice! Try again.")
            continue

        bot_choice = random.choice(choices)
        print(f"Bot chose: {bot_choice}")

        if user_choice == bot_choice:
            print("→ It's a tie!")
        elif (
            (user_choice == "rock" and bot_choice == "scissors") or
            (user_choice == "paper" and bot_choice == "rock") or
            (user_choice == "scissors" and bot_choice == "paper")
        ):
            print("→ You win this round!")
            user_score += 1
        else:
            print("→ Bot wins this round!")
            bot_score += 1

        round_number += 1

    # Final results
    print(f"\nFinal Score → You: {user_score} | Bot: {bot_score}")
    winner = "You" if user_score > bot_score else "Bot"
    print(f"🏁 Winner: {winner}")

    # Save result
    save_result(player_name, "Rock-Paper-Scissors", {
        "Result": winner,
        "Games Played": 1,
        "Wins": 1 if winner == "You" else 0,
        "Win %": "100" if winner == "You" else "0"
    })


# -------------------------------------------------------
#  Tic-Tac-Toe (vs Bot)
# -------------------------------------------------------
def print_ttt_board(board):
    """Prints Tic Tac Toe board as clean pandas grid without index/headers."""
    df = pd.DataFrame([board[0:3], board[3:6], board[6:9]])
    print("\nCurrent Board:")
    print(df.to_string(index=False, header=False))
    print()

def check_winner(board, symbol):
    win_combos = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ]
    return any(all(board[i]==symbol for i in combo) for combo in win_combos)

def is_full(board):
    return all(cell != " " for cell in board)

def bot_move(board, user_symbol, bot_symbol):
    win_combos = [[0,1,2],[3,4,5],[6,7,8],
                  [0,3,6],[1,4,7],[2,5,8],
                  [0,4,8],[2,4,6]]

    # Win if possible
    for combo in win_combos:
        vals = [board[i] for i in combo]
        if vals.count(bot_symbol)==2 and vals.count(" ")==1:
            return combo[vals.index(" ")]

    # Block user if needed
    for combo in win_combos:
        vals = [board[i] for i in combo]
        if vals.count(user_symbol)==2 and vals.count(" ")==1:
            return combo[vals.index(" ")]

    # Random move
    empty = [i for i in range(9) if board[i]==" "]
    return random.choice(empty)

def tic_tac_toe(player_name):
    board = [" "] * 9
    bot_first = random.choice([True, False])
    print(f"\n--- Tic-Tac-Toe ---\n{'Bot' if bot_first else 'You'} will start first!\n")

    user_symbol, bot_symbol = "X", "O"
    winner = None

    for turn in range(9):
        print_ttt_board(board)

        if (not bot_first and turn % 2 == 0) or (bot_first and turn % 2 == 1):
            try:
                move = int(input("Enter your move (1-9): ")) - 1
                if move < 0 or move > 8 or board[move] != " ":
                    print("Invalid move. Try again.")
                    continue
                board[move] = user_symbol
            except:
                print("Enter a valid number.")
                continue
            if check_winner(board, user_symbol):
                winner = "You"
                break
        else:
            move = bot_move(board, user_symbol, bot_symbol)
            board[move] = bot_symbol
            print(f"Bot chose position {move+1}")
            if check_winner(board, bot_symbol):
                winner = "Bot"
                break

        if is_full(board):
            break

    print_ttt_board(board)
    if winner:
        print(f"🏁 {winner} wins!")
    else:
        print("It's a draw!")

    # Save result
    save_result(player_name, "Tic-Tac-Toe", {
        "Result": winner if winner else "Draw",
        "Games Played": 1,
        "Wins": 1 if winner == "You" else 0,
        "Win %": "100" if winner == "You" else "0"
    })


# -------------------------------------------------------
#  Sudoku 6x6 (Random Puzzle Generator)
# -------------------------------------------------------
def print_sudoku_board(board):
    """Prints Sudoku 6x6 grid using pandas (clean look, no headers/index)."""
    display_board = [[(num if num != 0 else "") for num in row] for row in board]
    df = pd.DataFrame(display_board)
    print("\nCurrent Sudoku Board:")
    print(df.to_string(index=False, header=False))
    print()

def is_valid(board, row, col, num):
    if num in board[row]:
        return False
    for i in range(6):
        if board[i][col] == num:
            return False
    start_r, start_c = (row // 2)*2, (col // 3)*3
    for i in range(start_r, start_r+2):
        for j in range(start_c, start_c+3):
            if board[i][j] == num:
                return False
    return True

def find_empty(board):
    for i in range(6):
        for j in range(6):
            if board[i][j] == 0:
                return (i, j)
    return None

def fill_board(board):
    pos = find_empty(board)
    if not pos:
        return True
    r, c = pos
    nums = list(range(1,7))
    random.shuffle(nums)
    for num in nums:
        if is_valid(board, r, c, num):
            board[r][c] = num
            if fill_board(board):
                return True
            board[r][c] = 0
    return False

def remove_numbers(board, clues=10):
    puzzle = [row[:] for row in board]
    to_remove = 36 - clues
    while to_remove > 0:
        r, c = random.randint(0,5), random.randint(0,5)
        if puzzle[r][c] != 0:
            puzzle[r][c] = 0
            to_remove -= 1
    return puzzle

def sudoku_6x6(player_name):
    print("\n--- 6x6 Sudoku ---")
    board = [[0]*6 for _ in range(6)]
    fill_board(board)
    puzzle = remove_numbers(board, clues=10)

    start_time = datetime.now()
    while True:
        print_sudoku_board(puzzle)
        if not any(0 in row for row in puzzle):
            print(" Sudoku Completed!")
            break
        try:
            r = int(input("Enter row (1-6): ")) - 1
            c = int(input("Enter column (1-6): ")) - 1
            n = int(input("Enter number (1-6): "))
            if puzzle[r][c] != 0:
                print("That cell is already filled!")
                continue
            if is_valid(puzzle, r, c, n):
                puzzle[r][c] = n
            else:
                print(" Invalid move.")
        except:
            print("Invalid input.")

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    save_result(player_name, "Sudoku 6x6", {
        "Result": "Completed",
        "Games Played": 1,
        "Wins": 1,
        "Win %": "100",
        "Time": f"{duration:.2f} sec"
    })
    


# -------------------------------------------------------
#  Main Menu
# -------------------------------------------------------
def main_menu():
    print("Welcome to the Game Hub!")
    player_name = input("Enter your name: ").strip()

    while True:
        print("\n--- Main Menu ---")
        print("1. Rock Paper Scissors")
        print("2. Tic Tac Toe")
        print("3. Sudoku 6x6")
        print("4. View Past Stats")
        print("5. Exit")
        choice = input("Choose an option (1-5): ")

        if choice=='1': 
            rock_paper_scissors(player_name)
        elif choice=='2': 
            tic_tac_toe(player_name)
        elif choice=='3': 
            sudoku_6x6(player_name)
        elif choice=='4': 
            pass
        elif choice=='5':
            print("Thanks for playing!")
            break
        else: 
            print("Invalid choice!")


# -------------------------------------------------------
#  Start the program
# -------------------------------------------------------
main_menu()

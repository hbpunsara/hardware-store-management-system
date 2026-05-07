"""
Reinforcement Learning Recommender — Contextual Bandit (Epsilon-Greedy)
=======================================================================
Uses a Q-table to rank product recommendations. The agent learns which
products are more likely to be added to cart based on positive feedback.

Q(a) += α * (reward - Q(a))

Rewards:
  +1.0  = product was added to cart (user accepted recommendation)
  -0.1  = product was shown but ignored

Usage (CLI):
  # Get recommendations given cart items
  python rl_recommender.py recommend "Hammer 16oz,Duct Tape"

  # Update Q-table after feedback
  python rl_recommender.py feedback "Duct Tape" 1
  python rl_recommender.py feedback "Paint Brush 2in" 0
"""

import json
import os
import sys
import random
import math

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
Q_TABLE_PATH = os.path.join(SCRIPT_DIR, "models", "q_table.json")
RULES_PATH = os.path.join(SCRIPT_DIR, "rules.json")

# Hyperparameters
ALPHA = 0.3          # learning rate
EPSILON = 0.2        # exploration rate (20% random, 80% exploit)
DEFAULT_Q = 0.5      # prior Q-value for unseen products (optimistic init)
TOP_N = 3            # number of recommendations to return


def load_q_table() -> dict:
    if os.path.exists(Q_TABLE_PATH):
        try:
            with open(Q_TABLE_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_q_table(q_table: dict):
    os.makedirs(os.path.dirname(Q_TABLE_PATH), exist_ok=True)
    with open(Q_TABLE_PATH, "w") as f:
        json.dump(q_table, f, indent=2)


def load_rules() -> list:
    if os.path.exists(RULES_PATH):
        try:
            with open(RULES_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def get_candidates_from_rules(cart_items: list[str]) -> list[str]:
    """
    Use existing market basket rules to get candidate products
    that are associated with items currently in the cart.
    """
    rules = load_rules()
    cart_lower = {item.lower() for item in cart_items}
    candidates = set()

    for rule in rules:
        products = rule.get("products", [])
        products_lower = [p.lower() for p in products]
        # If any cart item matches a product in the rule, add the others as candidates
        if any(p in cart_lower for p in products_lower):
            for p in products:
                if p.lower() not in cart_lower:
                    candidates.add(p)

    return list(candidates)


def recommend(cart_items: list[str], n: int = TOP_N) -> list[str]:
    """
    Return top-N product recommendations for the given cart items.
    Uses epsilon-greedy: with prob EPSILON, explore randomly; otherwise
    rank by Q-value and return the best ones.
    """
    candidates = get_candidates_from_rules(cart_items)

    if not candidates:
        return []

    q_table = load_q_table()

    # Epsilon-greedy selection
    if random.random() < EPSILON:
        # Explore: randomly shuffle and pick top-N
        random.shuffle(candidates)
        return candidates[:n]
    else:
        # Exploit: rank by Q-value (default = DEFAULT_Q for unseen products)
        ranked = sorted(
            candidates,
            key=lambda p: q_table.get(p, DEFAULT_Q),
            reverse=True
        )
        return ranked[:n]


def update(product: str, reward: float):
    """
    Update the Q-value for a product given its reward.
    Q(a) += alpha * (reward - Q(a))
    """
    q_table = load_q_table()
    current_q = q_table.get(product, DEFAULT_Q)
    new_q = current_q + ALPHA * (reward - current_q)
    # Clip to [0, 1]
    q_table[product] = round(max(0.0, min(1.0, new_q)), 4)
    save_q_table(q_table)
    return q_table[product]


def get_q_table() -> dict:
    return load_q_table()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: rl_recommender.py <recommend|feedback|qtable> [args]"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "recommend":
        cart_str = sys.argv[2] if len(sys.argv) > 2 else ""
        cart = [item.strip() for item in cart_str.split(",") if item.strip()]
        result = recommend(cart)
        print(json.dumps({"recommendations": result}))

    elif command == "feedback":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Usage: rl_recommender.py feedback <product> <reward>"}))
            sys.exit(1)
        product = sys.argv[2]
        reward = float(sys.argv[3])
        new_q = update(product, reward)
        print(json.dumps({"product": product, "reward": reward, "new_q": new_q}))

    elif command == "qtable":
        print(json.dumps(get_q_table()))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)

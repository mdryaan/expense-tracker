import json
import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'expenses.json')

VALID_CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other']


def read_expenses():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        try:
            return json.load(f)
        except (json.JSONDecodeError, ValueError):
            return []


def write_expenses(expenses):
    with open(DATA_FILE, 'w') as f:
        json.dump(expenses, f, indent=2)


@app.route('/expenses', methods=['GET'])
def get_expenses():
    expenses = read_expenses()
    category = request.args.get('category')
    sort_by = request.args.get('sort', 'date')

    if category and category != 'all':
        expenses = [e for e in expenses if e.get('category') == category]

    if sort_by == 'amount':
        expenses = sorted(expenses, key=lambda e: e.get('amount', 0), reverse=True)
    else:
        expenses = sorted(expenses, key=lambda e: e.get('date', ''), reverse=True)

    return jsonify(expenses)


@app.route('/expenses', methods=['POST'])
def add_expense():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    title = data.get('title', '').strip()
    amount = data.get('amount')
    category = data.get('category', '').strip()
    date = data.get('date', '').strip()

    if not title or amount is None or not category or not date:
        return jsonify({'error': 'All fields are required'}), 400

    if category not in VALID_CATEGORIES:
        return jsonify({'error': 'Invalid category'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid amount'}), 400

    if len(title) > 100:
        return jsonify({'error': 'Title too long (max 100 chars)'}), 400

    expense = {
        'id': str(uuid.uuid4()),
        'title': title,
        'amount': round(amount, 2),
        'category': category,
        'date': date,
        'created_at': __import__('datetime').datetime.utcnow().isoformat()
    }

    expenses = read_expenses()
    expenses.append(expense)
    write_expenses(expenses)

    return jsonify(expense), 201


@app.route('/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expenses = read_expenses()
    updated = [e for e in expenses if e.get('id') != expense_id]

    if len(updated) == len(expenses):
        return jsonify({'error': 'Expense not found'}), 404

    write_expenses(updated)
    return jsonify({'message': 'Deleted successfully'}), 200


@app.route('/expenses/summary', methods=['GET'])
def get_summary():
    expenses = read_expenses()
    total = sum(e.get('amount', 0) for e in expenses)
    by_category = {}
    for e in expenses:
        cat = e.get('category', 'Other')
        by_category[cat] = by_category.get(cat, 0) + e.get('amount', 0)
    return jsonify({'total': round(total, 2), 'by_category': by_category, 'count': len(expenses)})


if __name__ == '__main__':
    app.run(debug=True, port=5000)

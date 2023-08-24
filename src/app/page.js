"use client";
import { useState, useEffect } from "react";
import { Client, Databases, ID, Query } from "appwrite";

const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_URL)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export default function Home() {
  const [description, setDescription] = useState(""); //user input for description
  const [amount, setAmount] = useState(""); //user input for amount
  const [category, setCategory] = useState(""); //user input for category
  const [selectedCategory, setselectedCategory] = useState(""); //Selected category from the dropdown

  const [expenses, setExpenses] = useState([]); // the list of expenses
  const [categories, setCategories] = useState([]); // the category list for the dropdown
  const [selectedButton, setSelectedButton] = useState("Most Recent"); //Selected query button

  const [isLoading, setisLoading] = useState(false); // the loading state

  // Json object to store the query methods
  const queries = {
    "Most Recent": Query.orderDesc("$createdAt"),
    Oldest: Query.orderAsc("$createdAt"),
    "Highest Price": Query.orderDesc("amount"),
    "Lowest Price": Query.orderAsc("amount"),
    category: Query.equal("category", [selectedCategory]),
  };

  // Function to update the selectedButton state when clicked on any of the buttons
  const handleButtonClick = (button) => {
    setSelectedButton(button);
  };

  // Function to add a new expense
  const handleAddExpense = () => {
    const expenseData = {
      description,
      amount,
      category,
    };

    const promise = databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
      ID.unique(),
      expenseData
    );

    // if successfull, fetch the expense list and all the categories. And reset the state values for user inputs
    promise.then(
      function (response) {
        console.log(response);
        fetchExpenses([queries[selectedButton]]);
        fetchCategories();
        setAmount("");
        setDescription("");
        setCategory("");
      },
      function (error) {
        console.log(error); // Failure
      }
    );
  };

  // Function to fetch the expenses, queriesArr is the array of query methods required to query the data.
  const fetchExpenses = (queriesArr) => {
    setisLoading(true);
    if (selectedCategory !== "") {
      queriesArr.push(queries["category"]);
    }

    const promise = databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
      queriesArr
    );

    promise.then(
      function (response) {
        // console.log(response); // Success
        setExpenses(response.documents);
        setisLoading(false);
      },
      function (error) {
        console.log(error); // Failure
        setisLoading(false);
      }
    );
  };

  // Function to fetch the categories and update the state
  const fetchCategories = () => {
    const promise = databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID
    );

    promise.then(
      function (response) {
        // console.log(response); // Success
        const categories = new Set();
        response.documents.forEach((r) => {
          categories.add(r.category);
        });
        setCategories(Array.from(categories));
      },
      function (error) {
        console.log(error);
      }
    );
  };

  // Function to format the datetime from the passed argument and return a more readable string value
  const formatDateTime = (dateTimeString) => {
    const options = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const date = new Date(dateTimeString);
    return date.toLocaleString(undefined, options);
  };

  // Function to update the state value when category is selected from the dropdown
  const onCategoryChange = (e) => {
    setselectedCategory(e.target.value);
  };

  // Fetch the expense list when the filter or the category is changed. (If the user selects a new category or clicks on a different filter button)
  useEffect(() => {
    fetchExpenses([queries[selectedButton]]);
  }, [selectedButton, selectedCategory]);

  // Fetch the category list when the category is updated. (If the user selects a new category from the dropdown)
  useEffect(() => {
    fetchCategories();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-orange-50 font-mono whitespace-pre">
      <div className="bg-orange-300">
        <div className="max-w-6xl mx-auto">
          <nav className="text-center pt-4">
            <h2 className="font-semibold text-orange-800">Expense Tracker</h2>
          </nav>

          <nav className="bg-orange-50 rounded-lg my-4 mx-2" id="navbar">
            <div className="flex pt-3 md:py-3 flex-col md:flex-row">
              <div className="flex flex-col basis-4/6 border-b py-2 md:py-0 md:border-r-2 md:border-b-0 border-orange-200 ms-3">
                <label htmlFor="desc" className="text-xs text-slate-500">
                  Description*
                </label>
                <input
                  type="text"
                  placeholder="Movies"
                  className="text-md pt-1 focus:outline-0 bg-inherit"
                  name="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col basis-2/6 border-b py-2 md:py-0 md:border-r-2 md:border-b-0 border-orange-200 ms-3">
                <label htmlFor="amount" className="text-xs text-slate-500">
                  Amount*
                </label>
                <input
                  type="number"
                  placeholder="500"
                  className="text-md pt-1 focus:outline-0 bg-inherit"
                  name="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col basis-2/6 ms-3 py-2 md:py-0">
                <label htmlFor="category" className="text-xs text-slate-500">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="Entertainment"
                  className="text-md pt-1 focus:outline-0 bg-inherit"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <button
                className="basis-2/6 m-3 md:ms-0 md:my-0 py-1 md:py-0 rounded-md bg-orange-950 border-2 border-orange-900/50  active:border-orange-400 text-orange-100"
                onClick={handleAddExpense}
              >
                Add Expense
              </button>
            </div>
          </nav>
          <div className="flex justify-between text-orange-800 mx-2 pb-4 overflow-x-scroll sm:overflow-x-auto">
            <div className="">
              <button
                className={`p-1 px-4 rounded-md ${
                  selectedButton === "Most Recent"
                    ? "bg-orange-200"
                    : "hover:text-orange-100"
                }`}
                onClick={() => handleButtonClick("Most Recent")}
              >
                Most Recent
              </button>
              <button
                className={`p-1 px-4 rounded-md ${
                  selectedButton === "Oldest"
                    ? "bg-orange-200"
                    : "hover:text-orange-800/50"
                }`}
                onClick={() => handleButtonClick("Oldest")}
              >
                Oldest
              </button>
              <button
                className={`p-1 px-4 rounded-md ${
                  selectedButton === "Highest Price"
                    ? "bg-orange-200"
                    : "hover:text-orange-800/50"
                }`}
                onClick={() => handleButtonClick("Highest Price")}
              >
                Highest Price
              </button>
              <button
                className={`p-1 px-4 rounded-md ${
                  selectedButton === "Lowest Price"
                    ? "bg-orange-200"
                    : "hover:text-orange-800/50"
                }`}
                onClick={() => handleButtonClick("Lowest Price")}
              >
                Lowest Price
              </button>
            </div>

            <div className="flex items-center ms-2 ps-2 sm:border-0 border-l border-orange-700/50">
              <label htmlFor="categories" className="pe-2 text-orange-800/50">
                Select Category-
              </label>
              <select
                className="px-3 py-1.5 focus:outline-none cursor-pointer rounded-md bg-orange-200"
                name="categories"
                id="categories"
                onChange={onCategoryChange}
                value={selectedCategory}
              >
                <option value="">All Categories</option>
                {categories.map((category) => {
                  return (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-t-2xl h-4 bg-orange-50"></div>
      </div>
      <div className="bg-orange-50">
        <div className="max-w-6xl mx-auto flex-1">
          {isLoading ? (
            <div
              role="status"
              className="flex mt-6 justify-center items-center"
            >
              <svg
                aria-hidden="true"
                class="w-8 h-8 mr-2 text-gray-200 animate-spin fill-orange-400"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span class="sr-only">Loading...</span>
            </div>
          ) : (
            <div>
              <div id="expense-list mx-2">
                <div className="flex flex-col w-full px-2">
                  {expenses.map((expense) => {
                    return (
                      <div
                        className="border-b-2 border-orange-700/10 p-2 py-4 flex flex-col sm:flex-row justify-between items-start"
                        key={expense.$id}
                      >
                        <div className="flex flex-col">
                          <div className="flex">
                            <p>{expense.description}</p>
                            <p className="ms-2 text-orange-600/75 px-4 rounded-full border border-orange-600/75">
                              {expense.category}
                            </p>
                          </div>
                          <p className="text-lg font-semibold">
                            {expense.amount}
                          </p>
                        </div>
                        <p className="">{formatDateTime(expense.$createdAt)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

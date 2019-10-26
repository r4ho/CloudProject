'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LimitSchema = new Schema({
  employeename: {
    type: String,
    required: 'Enter Employee Name'
  }
  ,
  expenselimit: {
    type: Number,
    required: 'Enter Expense Limit'
  }
});

var ImageSchema = new Schema ({
  image: {
    type: Buffer, 
    contentType: String
  }
});


var ExpenseSchema = new Schema({
  employee_id: {
    type: String,
    required: 'Enter employee id'
  },
  name: {
    type: String,
    required: 'Enter name of expense'
  },
  description: {
    type:String,
    required: 'Enter Description'
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: [{
      type: String,
      enum: ['pending', 'ongoing', 'completed']
    }],
    default: ['pending']
  },
  amount: {
    type: Number,
    required: "Enter Expense Amount"
  }
});

module.exports = mongoose.model('Expenses', ExpenseSchema);
module.exports = mongoose.model('ExpenseLimit', LimitSchema);
module.exports = mongoose.model('ExpenseImage', ImageSchema);
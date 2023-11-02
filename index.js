require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
//schema from person.js
const Person = require('./models/person')

const requestLogger = (req, res, next) => {
	console.log('Method:', req.method)
	console.log('Path:', req.path)
	console.log('Body:', req.body)
	console.log('---')
	next()
}

const errorHandler = (err, req, res, next) => {
	console.log(err)

	if (err.name === 'CastError') {
		return res.status(400).send({ error: 'malformatted id' })
	}
	else if (err.name === 'ValidationError') {
		return res.status(400).json({ err: err.message })
	}
	else if (err.name === 'ValidatorError') {
		return res.status(400).json({ err: err.message })
	}

	next(err)
}

const unknownEndpoint = (req, res) => {
	res.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(express.json())
app.use(requestLogger)
app.use(express.static('dist'))

/*
let persons = [
    {
      "id": 1,
      "name": "Arto Hellas",
      "number": "040-123456"
    },
    {
      "id": 2,
      "name": "Ada Lovelace",
      "number": "39-44-5323523"
    },
    {
      "id": 3,
      "name": "Dan Abramov",
      "number": "12-43-234345"
    },
    {
      "id": 4,
      "name": "Mary Poppendieck",
      "number": "39-23-6423122"
    }
]

const generateId = () => {
  return(Math.floor(Math.random() * 1000));
}
*/

morgan.token('content', (req) => {
	if (req.method === 'POST'){
		return JSON.stringify(req.body)
	}
	return '-'
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content'))

//info page
app.get('/info', async (req, res) => {
	const date = new Date()

	res.send(
		`<p>Phonebook has info for ${await Person.countDocuments({})} people</p>
        <p>${date}</p>`)
})

//returns list of entries in database
app.get('/api/persons', (req, res) => {
	Person.find({}).then(person => {
		res.json(person)
	})
})

//returns specific entry related to id page
app.get('/api/persons/:id', (req, res, next) => {
	Person.findById(req.params.id).then(person => {
		if (person){
			res.json(person)
		} else {
			res.status(404).end()
		}
	})
		.catch(err => {
			next(err)
		})
})

//delete function
app.delete('/api/persons/:id', (req, res, next) => {
	Person.findByIdAndRemove(req.params.id)
		.then(() => {
			res.status(204).end()
		})
		.catch(err => next(err))
})

//creates a new entry
app.post('/api/persons', (req, res, next) => {
	const { name, number } = req.body

	/*const isDuplicate = persons.find(person => person.name === body.name);

  if (!body.name || !body.number){
    return res.status(400).json({
      error: 'content missing'
    })
  }
  else if (isDuplicate) {
    return res.status(400).json({
      error: 'name must be unique'
    })
  }
  */

	const person = new Person({
		name: name,
		number: number,
	})

	person.save().then(savedPerson => {
		res.json(savedPerson)
	})
		.catch(err => next(err))
})

//updates old entry
app.put('/api/persons/:id', (req, res, next) => {
	const { name, number } = req.body

	Person.findByIdAndUpdate(req.params.id, { name, number }, { new: true, runValidators: true, context: 'query' })
		.then(updatedPerson => {
			res.json(updatedPerson)
		})
		.catch(err => next(err))
})

app.use(unknownEndpoint)
app.use(errorHandler)

// eslint-disable-next-line no-undef
const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})

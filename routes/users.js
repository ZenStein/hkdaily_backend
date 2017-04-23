var express = require('express');
const multer = require('multer')
var upload = multer({ dest: 'uploads/' })
var fs = require('fs')
var cheerio = require('cheerio')
var mongoose = require('mongoose')
var router = express.Router();

// mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://localhost/contacts');

// var contactsSchema = new mongoose.Schema({
//   firstName: String,
//   lastName: String,
//   address: String,
//   city: String,
//   state: String,
//   zip: String,
//   number: String,
//   numberTwo: String,
//   email: String,
//   cabin: Number,
//   status: String,
//   turnover: Boolean,
//   linensNumber: Number

// })

// var contacts = mongoose.model('mynewcontacts', contactsSchema)
// contacts.remove({}, function(err) { 
//    console.log('collection removed') 
// }).exec();


//var actives = mongoose.model('actives', contactsSchema)
// contacts.create({
//   name: 'christoph',
//   number: '90980007834'  
// }).then(function(err, data){
//   console.log('err data below')
//   console.log(err, data)
// })


/* GET users listing. */
// router.post('/',function(req, res, next){
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
//   next()
// }, function(req, res, next) {
// 	// Comment out this line:
//   //res.send('respond with a resource');

//   // And insert something like this instead:
//   res.json([{
//   	id: 1,
//   	username: "samsepi0l"
//   }, {
//   	id: 2,
//   	username: "D0loresH4ze"
//   }]);
// });
function filterCabin(obj){
  var newObj = obj.map(function(anObj){
    var cabinString = anObj.cabin
    var dex = cabinString.indexOf('-')
    var filtered = parseInt(cabinString.substring(0,dex), 10)
   // console.log(filtered)
    anObj.cabin = filtered
    return anObj
  })
  return newObj
}
function filterName(obj){
  var newObj = obj.map(function(anObj){
    var name = anObj.name
    var filteredName = name.replace(/[^A-Za-z ,-]/g, '')
    filteredName = filteredName.split(',')
    if(filteredName.length >= 3){
      throw new Error('there is a comma on the name')
    }
   // console.log(filteredName)
    anObj.firstName = filteredName[1].trim()
    anObj.lastName = filteredName[0].trim()

   // console.log(filteredName)
    //anObj.name = filteredName
    return anObj
  })
  return newObj
}
router.post('/', 
function(req, res, next){
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  next()
}, 
upload.array('files', 3), 
function (req, res) {
    function getContacts(err, data){
      //console.log(data.toString().split('\n'))
      var newObj = []
      var contactsArrayOfStr = data.toString().split('\n')
      contactsArrayOfStr.forEach(function(contactStr){
        contactArr = contactStr.replace(/["]+/g, '').split(',')
        var contact = {
          firstName: contactArr[0],
          lastName: contactArr[1],
          address: contactArr[2],
          city: contactArr[4],
          state: contactArr[5],
          zip: contactArr[6],
          number: contactArr[7],
          numberTwo:contactArr[8],
          email: contactArr[9],
          cabin: null,
          status: '',
          turnover: false,
          linensNumber: 0
        }
        newObj.push(contact)
        // contacts.create(contact).then(function(err, data){
        //   console.log('created contact 1')
        // //  console.log(err, data)
        // })
      })
      return newObj
    }    
    function getActives(err, data){
      var $ = cheerio.load(data.toString())
      var newObj = []
      $('div.s7').each(function() {
        var $this = $(this);
        newObj.push({
            'name' : $this.find('span.f15').text(),
            'status' : $this.find('span.f19').text(),
            'cabin' : $this.find('span.f14').text()
        });

      });
      newObj = filterCabin(newObj)
      newObj = filterName(newObj)
      return newObj
      // newObj.forEach(function(aContact){
      // //  console.log('acontact', aContact)
      //   var query = {
      //     firstName: aContact.firstName, 
      //     lastName: aContact.lastName
      //   }
      //   var newInfo = {
      //     cabin: aContact.cabin,
      //     status: aContact.status
      //   }
       // contacts.findOneAndUpdate(query, newInfo,{upsert: false, new: true}, function(err, doc){
          // if(err){
          //   throw new Error('contact wasn\'t found')
          // }
          //console.log('err after merge', err)
       //   console.log('merge active 2')
       // })
     // })
     // contacts.remove({cabin: null}).exec()
      //  console.log(newObj)
    }
    function getPOS(err, data){
      var $ = cheerio.load(data.toString())
      var linensObj = []
      var test = $('.s11').find("span:contains('Linen')").parent().nextUntil('.s12').each(function(){
         var $this = $(this);
         var name = $this.find('span.f8').text()
         var numberLinens = $this.find('span.f24').text()
         //console.log((name.match(/ /g) || []).length)
         if((name.match(/ /g) || []).length != 1){
           throw new Error('extra space inside name')
         }
         var nameArr = name.split(' ')
         var firstName = nameArr[0].trim()
         var lastName = nameArr[1].trim()
         var linenOrder = {numberLinens, firstName, lastName}
          //  name: $this.find('span.f8').text(),
          //  numberLinens: $this.find('span.f24').text()
         
         linensObj.push(linenOrder)
         //console.log($this.find('span.f8').text())
      })
      return linensObj
      // linensObj.forEach(function(linenOrder){
      //   var query = {
      //     firstName: linenOrder.firstName,
      //     lastName: linenOrder.lastName
      //   }
      //   var newInfo = {
      //     linensNumber: linenOrder.numberLinens
      //   }
      //    contacts.findOneAndUpdate(query, newInfo,{upsert: false, new: true}, function(err, doc){
      //      console.log('pos 3')
      //    })
      // })
      //console.log(linensObj)
    }
    function mergeAllData(contacts, actives, POSes){
      var mergedContacts = contacts.map(function(contact){
        actives.forEach(function(active){
          if(active.firstName == contact.firstName && active.lastName == contact.lastName){
            contact.status = active.status
            contact.cabin = active.cabin
          }
        })
        POSes.forEach(function(pos){
         // console.log(pos)
         // console.log('pos:',pos.firstName)
         // console.log('cont:', contact.firstName)
          if(pos.firstName == contact.firstName && pos.lastName == contact.lastName){
          //  console.log('true')
            contact.linensNumber = pos.numberLinens
          }
        })
        return contact
      })
      return mergedContacts
    }
    function removeCabinNullsAndStayovers(data){
      var newData = data.filter(function(d){
        return d.cabin != null
      }).filter(function(d2){
        return d2.status != 'Sta'
      })
      return newData
    }
    function getCabinOfStatus(data, status){
      var newStatus = []
      data.filter(function(d){
        return d.status == status
      }).forEach(function(d){
        newStatus.push(d.cabin)
      })
     // console.log('statuses', newStatus)
     return newStatus
    }
    function getMatches(arr1, arr2){
      var matches = []
      arr1.forEach(function(a){
        arr2.forEach(function(b){
          if(a == b){
            //console.log('true')
            matches.push(a)
          }
        })
      })
      //console.log(matches)
      return matches
    }
    function calculateTOBool(data){
      var departures = getCabinOfStatus(data, 'Dep')
      var arrivals = getCabinOfStatus(data, 'Arr')
      var matches = getMatches(departures, arrivals)
      data.map(function(d){
        matches.forEach(function(match){
          if(match == d.cabin){
            d.turnover = true
            //console.log('match', d)
          }
        })
        return d
      })
      return data
    }
    function addLinenToStrictDeparts(data){
      data.map(function(d){
        if(d.status == 'Dep' && d.turnover == false){
          d.linensNumber = 1
        }
        return d
      })
      return data
    }
    //TODO: find these files dynamically.
    var contactsFile = fs.readFileSync(req.files[2].path, 'utf8')//, contactsToDB)
    var activeFile = fs.readFileSync(req.files[1].path, 'utf8')//, mergeActiveToContacts)
    var posFile = fs.readFileSync(req.files[0].path, 'utf8')//, parsePointOfSale)
    //AO stands for arrayOfObjects
    var contactsAO = getContacts(null, contactsFile)
    var activeAO = getActives(null, activeFile)
    var posAO = getPOS(null, posFile)
    var finalizedData = mergeAllData(contactsAO, activeAO, posAO)
    finalizedData = removeCabinNullsAndStayovers(finalizedData)
    finalizedData = calculateTOBool(finalizedData)
    finalizedData = addLinenToStrictDeparts(finalizedData)
    
    res.json(finalizedData)
});



module.exports = router;
